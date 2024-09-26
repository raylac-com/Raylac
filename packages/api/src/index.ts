import 'dotenv/config';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';
import prisma from './lib/prisma';
import { Hex } from 'viem';
import { authedProcedure, publicProcedure, router } from './trpc';
import { createContext } from './context';
import { handleNewStealthAccount } from './lib/stealthAccount';
import signUp from './api/signUp';
import { webcrypto } from 'node:crypto';
import getUsers from './api/getUsers';
import getTransferHistory from './api/getTransferHistory';
import signIn from './api/signIn';
import getUsdToJpy from './api/getUsdToJpy';
import updateDisplayName from './api/updateDisplayName';
import updateUsername from './api/updateUsername';
import updateProfileImage from './api/updateProfileImage';
import { signUserOp } from './lib/paymaster';
import { UserOperation } from '@raylac/shared';
import getStealthAccounts from './api/getStealthAccounts';
import getTokenBalancesPerChain from './api/getTokenBalancesPerChain';
import getTokenBalances from './api/getTokenBalances';
import getAddressBalancesPerChain from './api/getAddressBalancesPerChain';
import { getBlockTimestamp } from './utils';
import getTokenPrices from './api/getTokenPrices';
import getUserAddresses from './api/getUserAddresses';
import submitUserOperation from './api/submitUserOperation';
import getRaylacTransferDetails from './api/getRaylacTransferDetails';
import getNativeTransferDetails from './api/getNativeTransferDetails';
import getUser from './api/getUser';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const appRouter = router({
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

  submitUserOperation: authedProcedure
    .input(
      z.object({
        userOp: z.any(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      await submitUserOperation({
        userOp: input.userOp as UserOperation,
      });

      return 'ok';
    }),

  /**
   * Get all users
   */
  getUsers: publicProcedure.query(async () => {
    const users = await getUsers();
    return users;
  }),

  getUser: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async opts => {
      const { input } = opts;
      const user = await getUser({ userId: input.userId });

      return user;
    }),

  /**
   * Get the balances of tokens for all chains and supported tokens
   * for the user
   */
  getTokenBalancesPerChain: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const balances = await getTokenBalancesPerChain({ userId });
    return balances;
  }),

  getAddressBalancesPerChain: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;
    const isDevMode = opts.ctx.isDevMode;

    const balances = await getAddressBalancesPerChain({ userId, isDevMode });
    return balances;
  }),

  /**
   * Get the balances of tokens for all chains and supported tokens
   */
  getTokenBalances: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;
    const isDevMode = opts.ctx.isDevMode;

    const balances = await getTokenBalances({ userId, isDevMode });
    return balances;
  }),

  /**
   * Get the stealth accounts of the user
   */
  getStealthAccounts: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const addressWithBalances = await getStealthAccounts({ userId });

    return addressWithBalances;
  }),

  /**
   * Get the transaction history of the user
   */
  getTxHistory: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;
    const isDevMode = opts.ctx.isDevMode;

    const transfers = await getTransferHistory({ userId, isDevMode });

    return transfers;
  }),

  getRaylacTransferDetails: authedProcedure
    .input(
      z.object({
        executionTag: z.string(),
      })
    )
    .query(async opts => {
      const { input } = opts;

      const details = await getRaylacTransferDetails({
        executionTag: input.executionTag as Hex,
      });

      return details;
    }),

  getNativeTransferDetails: authedProcedure
    .input(
      z.object({
        txHash: z.string(),
        traceAddress: z.string(),
      })
    )
    .query(async opts => {
      const { input } = opts;

      const details = await getNativeTransferDetails({
        txHash: input.txHash as Hex,
        traceAddress: input.traceAddress,
      });

      return details;
    }),

  getUserAddresses: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const userAddresses = await getUserAddresses({ userId });

    return userAddresses;
  }),

  /**
   * Update the display name of the user
   */
  updateDisplayName: authedProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;
      const userId = opts.ctx.userId;

      await updateDisplayName({
        userId,
        name: input.name,
      });
    }),

  /**
   * Update the username of the user
   */
  updateUsername: authedProcedure
    .input(
      z.object({
        username: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;
      const userId = opts.ctx.userId;

      await updateUsername({
        userId,
        username: input.username,
      });
    }),

  updateProfileImage: authedProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      await updateProfileImage({
        userId: opts.ctx.userId,
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
      });
      return 'ok';
    }),

  getUsdToJpy: publicProcedure.query(async () => {
    const usdToJpy = await getUsdToJpy();
    return usdToJpy;
  }),

  /**
   * Add a new stealth account to the user.
   * This is called when the user wants to receive/deposit funds to a new stealth address.
   */
  addStealthAccount: publicProcedure
    .input(
      z.object({
        address: z.string(),
        stealthPubKey: z.string(),
        ephemeralPubKey: z.string(),
        viewTag: z.string(),
        userId: z.number(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      await handleNewStealthAccount({
        userId: input.userId,
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

  getBlockTimestamp: publicProcedure
    .input(
      z.object({
        chainId: z.number(),
        blockNumber: z.number(),
      })
    )
    .query(async opts => {
      const { input } = opts;

      const timestamp = await getBlockTimestamp(
        input.blockNumber,
        input.chainId
      );

      return timestamp;
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

      const { user, token } = await signIn({
        issuedAt: input.issuedAt,
        userSpendingPubKey: input.userSpendingPubKey,
        signature: input.signature,
      });

      return { userId: user.id, token };
    }),

  /**
   * Sign up a new user
   */
  signUp: publicProcedure
    .input(
      z.object({
        name: z.string(),
        username: z.string(),
        spendingPubKey: z.string(),
        viewingPrivKey: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      const { user, token } = await signUp({
        name: input.name,
        username: input.username,
        spendingPubKey: input.spendingPubKey as Hex,
        viewingPrivKey: input.viewingPrivKey as Hex,
      });

      return { userId: user.id, token };
    }),

  getTokenPrices: publicProcedure.query(async () => {
    const prices = await getTokenPrices();
    return prices;
  }),
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  // @ts-ignore
  createContext,
});

server.listen(3000);
