import 'dotenv/config';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';
import prisma from './lib/prisma';
import { Hex } from 'viem';
import { authedProcedure, publicProcedure, router } from './trpc';
import { UserOperation } from '@sutori/shared';
import { signUserOp } from './lib/paymaster';
import { createContext } from './context';
import { handleNewStealthAccount } from './lib/stealthAccount';
import send from './api/send';
import signUp from './api/signUp';
import { webcrypto } from 'node:crypto';
import getUsers from './api/getUsers';
import getStealthAccounts from './api/getStealthAccounts';
import getBalance from './api/getBalance';
import getTxHistory from './api/getTxHistory';
import signIn from './api/signIn';

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

      await send({
        senderUserId: userId,
        userOps,
        stealthAccount: input.stealthAccount,
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

  /**
   * Get the stealth accounts of the user
   */
  getStealthAccounts: authedProcedure.query(async opts => {
    const userId = opts.ctx.userId;

    const addressWithBalances = await getStealthAccounts({ userId });

    return addressWithBalances;
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
   * Get the details of a transfer
   */
  getTransferDetails: authedProcedure
    .input(
      z.object({
        transferIdOrTxHash: z.string(),
      })
    )
    .query(async opts => {
      const transferId = opts.input.transferIdOrTxHash;
      const userId = opts.ctx.userId;

      const transfer = await prisma.stealthTransfer.findUnique({
        where: {
          senderId: userId,
          id: transferId,
        },
      });

      return transfer;
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
