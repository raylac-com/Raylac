import 'dotenv/config';
import { z } from 'zod';
import { publicProcedure, router, createCallerFactory } from './trpc';
import { createContext } from './context';
import { webcrypto } from 'node:crypto';
import getTokenBalances from './api/getTokenBalances/getTokenBalances';
import getTokenBalancesMock from './api/getTokenBalances/getTokenBalances.mock';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { Hex } from 'viem';
import buildSwapUserOp from './api/buildSwapUserOp/buildSwapUserOp';
import submitUserOps from './api/submitUserOps/submitUserOps';
import getSupportedTokens from './api/getSupportedTokens/getSupportedTokens';
import getSupportedTokensMock from './api/getSupportedTokens/getSupportedTokens.mock';
import {
  BuildSwapUserOpRequestBody,
  GetSwapQuoteRequestBody,
  SubmitUserOpsRequestBody,
} from '@raylac/shared';
import getSwapQuote from './api/getSwapQuote/getSwapQuote';
import { logger } from '@raylac/shared-backend';
import getSwapQuoteMock from './api/getSwapQuote/getSwapQuote.mock';
import buildSwapUserOpMock from './api/buildSwapUserOp/buildSwapUserOp.mock';
import submitUserOpsMock from './api/submitUserOps/submitUserOps.mock';
import getTokenPrice from './api/getTokenPrice/getTokenPrice';
import { getTokenPriceMock } from './api/getTokenPrice/getTokenPrice.mock';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const MOCK_RESPONSE = process.env.MOCK_RESPONSE === 'true';

if (MOCK_RESPONSE) {
  logger.info('Starting API server in mock mode');
} else {
  logger.info('Starting API server in production mode');
}

export const appRouter = router({
  getTokenBalances: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ input }) => {
      return MOCK_RESPONSE
        ? getTokenBalancesMock({ address: input.address as Hex })
        : getTokenBalances({ address: input.address as Hex });
    }),

  buildSwapUserOp: publicProcedure
    .input(
      z.object({
        singerAddress: z.string(),
        quote: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      return MOCK_RESPONSE
        ? buildSwapUserOpMock(input as BuildSwapUserOpRequestBody)
        : buildSwapUserOp(input as BuildSwapUserOpRequestBody);
    }),

  submitUserOps: publicProcedure
    .input(z.object({ userOps: z.array(z.any()), swapQuote: z.any() }))
    .mutation(async ({ input }) => {
      return MOCK_RESPONSE
        ? submitUserOpsMock(input as SubmitUserOpsRequestBody)
        : submitUserOps(input as SubmitUserOpsRequestBody);
    }),

  getSwapQuote: publicProcedure.input(z.any()).mutation(async ({ input }) => {
    return MOCK_RESPONSE
      ? getSwapQuoteMock(input as GetSwapQuoteRequestBody)
      : getSwapQuote(input as GetSwapQuoteRequestBody);
  }),

  getSupportedTokens: publicProcedure
    .input(
      z.object({
        chainIds: z.array(z.number()),
      })
    )
    .query(async ({ input }) => {
      return MOCK_RESPONSE
        ? getSupportedTokensMock(input.chainIds)
        : getSupportedTokens(input.chainIds);
    }),

  getTokenPrice: publicProcedure
    .input(z.object({ tokenAddress: z.string(), chainId: z.number() }))
    .mutation(async ({ input }) => {
      return MOCK_RESPONSE
        ? getTokenPriceMock({
            tokenAddress: input.tokenAddress as Hex,
            chainId: input.chainId,
          })
        : getTokenPrice({
            tokenAddress: input.tokenAddress as Hex,
            chainId: input.chainId,
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
