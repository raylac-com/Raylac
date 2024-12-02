import 'dotenv/config';
import { z } from 'zod';
import { publicProcedure, router, createCallerFactory } from './trpc';
import { createContext } from './context';
import { webcrypto } from 'node:crypto';
import getTokenBalances from './api/getTokenBalances';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { Hex } from 'viem';
import buildSwapUserOp from './api/buildSwapUserOp';
import submitUserOps from './api/submitUserOps';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const appRouter = router({
  getTokenBalances: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getTokenBalances({ address: input.address as Hex });
    }),

  buildSwapUserOp: publicProcedure
    .input(
      z.object({
        singerAddress: z.string(),
        origins: z.array(
          z.object({
            chainId: z.number(),
            tokenAddress: z.string(),
            amount: z.string(),
          })
        ),
        recipient: z.string(),
        destinationChainId: z.number(),
        destinationTokenAddress: z.string(),
      })
    )
    .query(async ({ input }) => {
      return buildSwapUserOp(input as any);
    }),

  submitUserOps: publicProcedure
    .input(z.array(z.any()))
    .mutation(async ({ input }) => {
      return submitUserOps(input as any);
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
