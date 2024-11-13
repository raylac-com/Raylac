import 'dotenv/config';
import { z } from 'zod';
import prisma from './lib/prisma';
import { Hex } from 'viem';
import {
  authedProcedure,
  publicProcedure,
  router,
  createCallerFactory,
} from './trpc';
import { createContext } from './context';
import signUp from './api/signUp';
import { webcrypto } from 'node:crypto';
import getUsers from './api/getUsers';
import getTransferHistory from './api/getTransferHistory';
import signIn from './api/signIn';
import updateAddressLabel from './api/updateAddressLabel';
import updateDisplayName from './api/updateDisplayName';
import updateUsername from './api/updateUsername';
import updateProfileImage from './api/updateProfileImage';
import paymasterSignUserOp from './api/paymasterSignUserOp';
import { UserOperation } from '@raylac/shared';
import getStealthAccounts from './api/getStealthAccounts';
import getTokenBalances from './api/getTokenBalances';
import getAddressBalancesPerChain from './api/getAddressBalancesPerChain';
import getTokenPrices from './api/getTokenPrices';
import submitUserOps from './api/submitUserOps';
import getUser from './api/getUser';
import deleteAccount from './api/deleteAccount';
import getTransferDetails from './api/getTransferDetails';
import addStealthAccount from './api/addStealthAccount';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import pruneAnvil from './api/pruneAnvil';
import getSyncStatus from './api/getSyncStatus';
import buildMultiChainSendUserOps from './api/buildMultiChainSendUserOps';
import createAngelRequest from './api/createAngelRequest';
import updateAngelRequest from './api/updateAngelRequest';
import deleteAngelRequest from './api/deleteAngelRequest';
import getUserAngelRequests from './api/getUserAngelRequests';
import getAngelRequest from './api/getAngelRequest';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const appRouter = router({
  paymasterSignUserOp: authedProcedure
    .input(
      z.object({
        userOp: z.any(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;
      const userOp = input.userOp as UserOperation;

      const sig = await paymasterSignUserOp(userOp);

      return sig;
    }),

  submitUserOps: authedProcedure
    .input(
      z.object({
        userOps: z.array(z.any()),
        tokenPrice: z.number().optional(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      const result = await submitUserOps({
        userId: opts.ctx.userId,
        userOps: input.userOps as UserOperation[],
        tokenPrice: input.tokenPrice,
      });

      return result;
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

  getAddressBalancesPerChain: authedProcedure
    .input(
      z
        .object({
          includeAnvil: z.boolean().optional(),
        })
        .optional()
    )
    .query(async opts => {
      const userId = opts.ctx.userId;
      const includeAnvil = opts.input?.includeAnvil;

      const balances = await getAddressBalancesPerChain({
        userId,
        includeAnvil,
      });
      return balances;
    }),

  buildMultiChainSendUserOps: authedProcedure
    .input(
      z.object({
        to: z.string(),
        tokenId: z.string(),
        amount: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;
      const userId = opts.ctx.userId;

      const userOps = await buildMultiChainSendUserOps({
        to: input.to as Hex,
        userId,
        tokenId: input.tokenId,
        amount: input.amount,
      });

      return userOps;
    }),

  /**
   * Get the balances of tokens for all chains and supported tokens
   */
  getTokenBalances: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const balances = await getTokenBalances({ userId });
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
  getTransferHistory: authedProcedure
    .input(
      z
        .object({
          take: z.number().optional(),
          skip: z.number().optional(),
          includeAnvil: z.boolean().optional(),
        })
        .optional()
    )
    .query(async opts => {
      const userId = opts.ctx.userId;
      const take = opts.input?.take;
      const skip = opts.input?.skip;
      const includeAnvil = opts.input?.includeAnvil;

      const transfers = await getTransferHistory({
        userId,
        take,
        skip,
        includeAnvil,
      });

      return transfers;
    }),

  getTransferDetails: authedProcedure
    .input(
      z.object({
        transferId: z.number(),
      })
    )
    .query(async opts => {
      const { input } = opts;

      const details = await getTransferDetails({
        userId: opts.ctx.userId,
        transferId: input.transferId,
      });

      return details;
    }),

  updateAddressLabel: authedProcedure
    .input(
      z.object({
        address: z.string(),
        label: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      await updateAddressLabel({
        userId: opts.ctx.userId,
        address: input.address as Hex,
        label: input.label,
      });
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

  /**
   * Add a new stealth account to the user.
   * This is called when the user wants to receive/deposit funds to a new stealth address.
   */
  addStealthAccount: publicProcedure
    .input(
      z.object({
        address: z.string(),
        signerAddress: z.string(),
        ephemeralPubKey: z.string(),
        viewTag: z.string(),
        userId: z.number(),
        label: z.string(),
        useAnvil: z.boolean().optional(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      await addStealthAccount({
        userId: input.userId,
        stealthAccount: {
          address: input.address as Hex,
          signerAddress: input.signerAddress as Hex,
          ephemeralPubKey: input.ephemeralPubKey as Hex,
          viewTag: input.viewTag as Hex,
        },
        label: input.label,
        useAnvil: input.useAnvil,
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
        select: {
          id: true,
        },
        where: {
          username: input.username,
        },
      });

      return user ? false : true;
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

  createAngelRequest: authedProcedure
    .input(
      z.object({
        description: z.string(),
        usdAmount: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;
      const userId = opts.ctx.userId;

      const angelRequest = await createAngelRequest({
        userId,
        description: input.description,
        usdAmount: input.usdAmount,
      });

      return angelRequest;
    }),

  updateAngelRequest: authedProcedure
    .input(
      z.object({
        angelRequestId: z.number(),
        description: z.string(),
        usdAmount: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;
      await updateAngelRequest({
        angelRequestId: input.angelRequestId,
        description: input.description,
        usdAmount: input.usdAmount,
      });
    }),

  deleteAngelRequest: authedProcedure
    .input(z.object({ angelRequestId: z.number() }))
    .mutation(async opts => {
      const { input } = opts;
      await deleteAngelRequest({
        userId: opts.ctx.userId,
        angelRequestId: input.angelRequestId,
      });
    }),

  getUserAngelRequests: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;
    const angelRequests = await getUserAngelRequests({ userId });
    return angelRequests;
  }),

  getAngelRequest: authedProcedure
    .input(z.object({ angelRequestId: z.number() }))
    .query(async opts => {
      const { input } = opts;
      const angelRequest = await getAngelRequest({
        angelRequestId: input.angelRequestId,
      });
      return angelRequest;
    }),

  deleteAccount: authedProcedure.mutation(async opts => {
    const userId = opts.ctx.userId;
    await deleteAccount({ userId });
  }),

  pruneAnvil: authedProcedure.mutation(async _opts => {
    if (process.env.RENDER && !process.env.IS_PULL_REQUEST) {
      throw new Error('Cannot prune anvil in a non-pull request');
    }

    await pruneAnvil();
  }),

  getSyncStatus: publicProcedure
    .input(
      z.object({
        addresses: z.array(z.string()),
        chainIds: z.array(z.number()),
      })
    )
    .query(async opts => {
      const { input } = opts;
      return await getSyncStatus({
        addresses: input.addresses as Hex[],
        chainIds: input.chainIds,
      });
    }),

  getGitCommit: publicProcedure.query(async () => {
    return process.env.RENDER_GIT_COMMIT ?? '';
  }),
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  // @ts-ignore
  createContext,
});

server.listen(3000);
