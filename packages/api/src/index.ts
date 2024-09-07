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
import getBalance from './api/getBalance';
import buildStealthTransfer from './api/buildStealthTransfer';
import getTxHistory from './api/getTxHistory';
import signIn from './api/signIn';
import getUsdToJpy from './api/getUsdToJpy';
import updateDisplayName from './api/updateDisplayName';
import updateUsername from './api/updateUsername';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

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

  buildStealthTransfer: authedProcedure
    .input(
      z.object({
        amount: z.string(),
        toUserId: z.number(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      const stealthTransfer = await buildStealthTransfer({
        amount: input.amount,
        toUserId: input.toUserId,
      });

      return stealthTransfer;
    }),

  /**
   * Send a transfer to a stealth address
   */
  send: authedProcedure
    .input(
      z.object({
        stealthTransferData: z.object({
          inputs: z.array(
            z.object({
              amount: z.string(),
              from: z.object({
                address: z.string(),
                viewTag: z.string(),
                stealthPubKey: z.string(),
                ephemeralPubKey: z.string(),
              }),
            })
          ),
        }),
        signatures: z.array(z.string()),
      })
    )
    .mutation(async _opts => {
      return 'ok';
    }),

  /**
   * Get all users
   */
  getUsers: publicProcedure.query(async () => {
    const users = await getUsers();
    return users;
  }),

  /**
   * Get the USDC balance of the user
   */
  getBalance: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const totalBalance = await getBalance({ userId });

    return totalBalance;
  }),

  /**
   * Get the transaction history of the user
   */
  getTxHistory: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const transfers = await getTxHistory({ userId });

    return transfers;
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

  getUsdToJpy: publicProcedure.query(async () => {
    const usdToJpy = await getUsdToJpy();
    return usdToJpy;
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
        inviteCode: z.string(),
        spendingPubKey: z.string(),
        viewingPrivKey: z.string(),
      })
    )
    .mutation(async opts => {
      const { input } = opts;

      const { user, token } = await signUp({
        name: input.name,
        username: input.username,
        inviteCode: input.inviteCode,
        spendingPubKey: input.spendingPubKey as Hex,
        viewingPrivKey: input.viewingPrivKey as Hex,
      });

      return { userId: user.id, token };
    }),
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  createContext,
});

server.listen(3000);
