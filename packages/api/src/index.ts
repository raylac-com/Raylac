import 'dotenv/config';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';
import prisma from './lib/prisma';
import { Hex } from 'viem';
import { AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { authedProcedure, publicProcedure, router } from './trpc';
import jwt from 'jsonwebtoken';
import alchemy from './lib/alchemy';
import {
  buildSiweMessage,
  generateStealthAddress,
  getStealthAddress,
  sendUserOperation,
  splitToUnits,
  USDC_CONTRACT_ADDRESS,
  UserOperation,
} from '@sutori/shared';
import * as erc20 from './lib/erc20';
import { signUserOp } from './lib/paymaster';
import { privateKeyToAccount, publicKeyToAddress } from 'viem/accounts';
import { createContext } from './context';
import { JWT_PRIV_KEY, getTransferDataFromUserOp } from './utils';
import { SplitTransfer, Transfer } from './types';
import { publicClient } from './lib/viem';
import { saveStealthTransfer } from './lib/stealthTransfer';
import { handleNewStealthAccount } from './lib/stealthAccount';
import { verifySiweMessage } from 'viem/siwe';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const appRouter = router({
  /**
   * Returns whether an invite code is valid
   */
  isInviteCodeValid: publicProcedure
    .input(
      z.object({
        inviteCode: z.string(),
      })
    )
    .query(async opts => {
      const { input } = opts;
      console.log(`Checking invite code ${input.inviteCode}`);

      const unusedInviteCodeExists = await prisma.inviteCode.findFirst({
        where: {
          inviteCode: input.inviteCode,
          isUsed: false,
        },
      });

      return unusedInviteCodeExists ? true : false;
    }),

  signUserOp: authedProcedure
    .input(
      z.object({
        userOp: z.any(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;
      const userOp = input.userOp as UserOperation;

      // TODO: Validate that the user has signed this user operation

      const sig = await signUserOp(userOp);

      return sig;
    }),

  /**
   * Send a transfer to a stealth address
   */
  send: authedProcedure
    .input(
      z.object({
        userOps: z.any(),
        stealthAccount: z
          .object({
            ephemeralPubKey: z.string(),
            stealthPubKey: z.string(),
            viewTag: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      const userId = opts.ctx.userId;
      const userOps = input.userOps as UserOperation[];

      const transfers = userOps.map(getTransferDataFromUserOp);

      const to = transfers[0].to;

      // Check that the transfers are all going to the same address
      if (transfers.some(transfer => transfer.to !== to)) {
        throw new Error('Transfers must all be to the same address');
      }

      const transferAmount = transfers.reduce((acc, transfer) => {
        return acc + BigInt(transfer.amount);
      }, BigInt(0));

      const userOpHashes = [];

      for (const userOp of userOps) {
        const userOpHash = await sendUserOperation({
          client: publicClient,
          userOp,
        });
        userOpHashes.push(userOpHash);
      }

      await saveStealthTransfer({
        senderId: userId,
        amount: transferAmount,
        to,
        userOpHashes,
      });

      if (input.stealthAccount) {
        // If `stealthAccount` is provided, this is a transfer to a stealth account.
        // Announce the stealth account to the ERC5564 announcer contract.

        // Get the user who corresponds to the stealth account
        const stealthAccountUser = await prisma.userStealthAddress.findFirst({
          select: {
            userId: true,
          },
          where: {
            address: to,
          },
        });

        if (stealthAccountUser) {
          await handleNewStealthAccount({
            userId: stealthAccountUser.userId,
            stealthAccount: {
              address: to as Hex,
              stealthPubKey: input.stealthAccount.stealthPubKey as Hex,
              ephemeralPubKey: input.stealthAccount.ephemeralPubKey as Hex,
              viewTag: input.stealthAccount.viewTag as Hex,
            },
          });
        } else {
          console.error('Stealth account user not found');
        }
      }

      return 'ok';
    }),

  /**
   * Get all users
   */
  getUsers: publicProcedure.query(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        spendingPubKey: true,
        viewingPubKey: true,
      },
    });

    return users;
  }),

  /**
   * Get the stealth accounts of the user
   */
  getStealthAccounts: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const addresses = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
        stealthPubKey: true,
        viewTag: true,
        ephemeralPubKey: true,
      },
      where: {
        userId,
      },
    });

    const addressWithBalances = await Promise.all(
      addresses.map(async address => {
        const balance = await erc20.getUSDCBalance({
          address: address.address as Hex,
        });

        return {
          ...address,
          balance,
        };
      })
    );

    return addressWithBalances;
  }),

  /**
   * Get the USDC balance of the user
   */
  getBalance: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const addresses = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
      },
      where: {
        userId,
      },
    });

    const balances = await Promise.all(
      addresses.map(async address => {
        return erc20.getUSDCBalance({ address: address.address as Hex });
      })
    );

    const totalBalance = balances.reduce((acc, balance) => {
      return acc + balance;
    }, BigInt(0));

    return totalBalance;
  }),

  /**
   * Get the transaction history of the user
   */
  getTxHistory: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const addresses = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
      },
      where: {
        userId,
      },
    });

    const incomingTxs = await Promise.all(
      addresses.map(async address => {
        return alchemy.core.getAssetTransfers({
          category: [AssetTransfersCategory.ERC20],
          toAddress: address.address as Hex,
          contractAddresses: [USDC_CONTRACT_ADDRESS],
          order: SortingOrder.DESCENDING,
          withMetadata: true,
        });
      })
    );

    const outgoingTransfers = await prisma.stealthTransfer.findMany({
      select: {
        amount: true,
        to: true,
        userOpReceipts: {
          select: {
            success: true,
          },
        },
        createdAt: true,
      },
      where: {
        senderId: userId,
      },
    });

    const transfers: Transfer[] = [
      ...outgoingTransfers.map(transfer => ({
        type: 'outgoing',
        to: transfer.to,
        amount: Number(transfer.amount / BigInt(10 ** 6)),
        timestamp: transfer.createdAt.getTime(),
      })),
      ...incomingTxs.flatMap(txs =>
        txs.transfers.map(tx => ({
          type: 'incoming',
          from: tx.from || '',
          amount: tx.value as number,
          timestamp: new Date(tx.metadata.blockTimestamp).getTime(),
        }))
      ),
    ].sort((a, b) => b.timestamp - a.timestamp);

    return transfers;
  }),

  /**
   * Add a new stealth account to the user.
   * This is called when the user wants to receive/deposit funds to a new stealth address.
   */
  addStealthAccount: authedProcedure
    .input(
      z.object({
        address: z.string(),
        stealthPubKey: z.string(),
        ephemeralPubKey: z.string(),
        viewTag: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;
      const userId = opts.ctx.userId;

      await handleNewStealthAccount({
        userId,
        stealthAccount: {
          address: input.address as Hex,
          stealthPubKey: input.stealthPubKey as Hex,
          ephemeralPubKey: input.ephemeralPubKey as Hex,
          viewTag: input.viewTag as Hex,
        },
      });
    }),

  /**
   * Return whether a username is available
   */
  isUsernameAvailable: publicProcedure
    .input(
      z.object({
        username: z.string(),
      })
    )
    .query(async opts => {
      const { input } = opts;

      const user = await prisma.user.findFirst({
        where: {
          username: input.username,
        },
      });

      return user ? false : true;
    }),

  /**
   * Get user by id
   */
  getUser: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async opts => {
      const { input } = opts;

      const user = await prisma.user.findUnique({
        select: {
          id: true,
          name: true,
          username: true,
          spendingPubKey: true,
          viewingPubKey: true,
        },
        where: {
          id: input.userId,
        },
      });
      return user;
    }),

  signIn: publicProcedure
    .input(
      z.object({
        issuedAt: z.string(),
        userSpendingPubKey: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      const user = await prisma.user.findUnique({
        where: {
          spendingPubKey: input.userSpendingPubKey,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const userAddress = publicKeyToAddress(user.spendingPubKey as Hex);

      const message = buildSiweMessage({
        issuedAt: new Date(input.issuedAt),
        address: userAddress,
        chainId: publicClient.chain.id,
      });
      console.log('Message:', message);

      const isSigValid = await verifySiweMessage(publicClient, {
        address: userAddress,
        message,
        signature: input.signature as Hex,
      });
      console.log('Is signature valid:', isSigValid);

      if (!isSigValid) {
        throw new Error('Invalid signature');
      }

      const token = jwt.sign({ userId: user.id }, JWT_PRIV_KEY);

      return { userId: user.id, token };
    }),

  /**
   * Save a new user to the database
   */
  signUp: publicProcedure
    .input(
      z.object({
        name: z.string(),
        username: z.string(),
        inviteCode: z.string(),
        spendingPubKey: z.string(),
        viewingPrivKey: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      const viewingAccount = privateKeyToAccount(input.viewingPrivKey as Hex);

      // TODO: Check username validity

      const inviteCodeExists = await prisma.inviteCode.findFirst({
        where: {
          inviteCode: input.inviteCode,
          isUsed: false,
        },
      });

      if (!inviteCodeExists) {
        throw new Error('Invalid invite code');
      }

      const user = await prisma.user.create({
        data: {
          name: input.name,
          username: input.username,
          spendingPubKey: input.spendingPubKey,
          viewingPubKey: viewingAccount.publicKey,
          viewingPrivKey: input.viewingPrivKey,
        },
      });

      // TODO: Send sign up bonus

      const token = jwt.sign({ userId: user.id }, JWT_PRIV_KEY);

      // Mark the invite code as used
      await prisma.inviteCode.update({
        where: {
          inviteCode: input.inviteCode,
        },
        data: {
          isUsed: true,
        },
      });

      return { userId: user.id, token };
    }),

  split: publicProcedure
    .input(
      z.object({
        address: z.string(), // Address to split the amount
        amount: z.string(), // Parsed amount as a string
      })
    )
    .mutation(async opts => {
      const userId = 26;
      const { input } = opts;

      // TODO: Verify that the user is allowed to split.

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const adminUser = await prisma.user.findFirst({
        where: {
          id: 1,
        },
      });

      if (!adminUser) {
        throw new Error('Admin user not found');
      }

      const adminStealthAccounts = await prisma.userStealthAddress.findMany({
        where: {
          userId: adminUser.id,
        },
      });

      const decimals = 6;

      const result = splitToUnits({
        amount: BigInt(input.amount),
        decimals,
      });

      // Build transfers to send to the user's addresses
      const splitTransfers = [];

      for (const denomination in result) {
        const to = generateStealthAddress({
          spendingPubKey: user.spendingPubKey as Hex,
          viewingPubKey: user.viewingPubKey as Hex,
        });

        const stealthSigner = publicKeyToAddress(to.stealthPubKey);
        const address = await getStealthAddress({
          client: publicClient,
          stealthSigner,
        });

        if (!address) {
          throw new Error('Address not found');
        }

        const unitCount = result[denomination];

        for (let i = 0; i < unitCount; i++) {
          if (Math.random() > 0.5) {
            // Send from admin to user
            const splitTransferToUser: SplitTransfer = {
              to: address,
              amount: BigInt(denomination),
              account: adminStealthAccounts[0].address as Hex,
              tokenContract: USDC_CONTRACT_ADDRESS,
            };

            splitTransfers.push(splitTransferToUser);

            // Send from user to admin
            const splitTransferToAdmin: SplitTransfer = {
              to: adminStealthAccounts[0].address as Hex,
              amount: BigInt(denomination),
              account: input.address as Hex,
              tokenContract: USDC_CONTRACT_ADDRESS,
            };

            splitTransfers.push(splitTransferToAdmin);
          } else {
            // Send from user to user
            const splitTransferToUser: SplitTransfer = {
              to: address,
              amount: BigInt(denomination),
              account: input.address as Hex,
              tokenContract: USDC_CONTRACT_ADDRESS,
            };

            splitTransfers.push(splitTransferToUser);
          }
        }
      }

      // Build transfers to send to admin's addresses

      console.log('Split transfers:', splitTransfers);

      // Sign the call to make the transfers

      // Send the split amount to fresh addresses from admin account
      // Send the original amount to the admin account

      return result;
    }),
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  createContext,
});

server.listen(3000);
