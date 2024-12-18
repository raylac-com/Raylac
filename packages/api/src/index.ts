import 'dotenv/config';
import { z } from 'zod';
import { publicProcedure, router, createCallerFactory } from './trpc';
import { createContext } from './context';
import { webcrypto } from 'node:crypto';
import getTokenBalances from './api/getTokenBalances/getTokenBalances';
import getTokenBalancesMock from './api/getTokenBalances/getTokenBalances.mock';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { Hex } from 'viem';
import getSupportedTokens from './api/getSupportedTokens/getSupportedTokens';
import getSupportedTokensMock from './api/getSupportedTokens/getSupportedTokens.mock';
import {
  BuildMultiChainSendRequestBody,
  GetHistoryRequestBody,
  GetSwapQuoteRequestBody,
  SendTransactionRequestBody,
  SubmitSwapRequestBody,
} from '@raylac/shared';
import getSwapQuote from './api/getSwapQuote/getSwapQuote';
import { ed, logger, st } from '@raylac/shared-backend';
import getTokenPrice from './api/getTokenPrice/getTokenPrice';
import { getTokenPriceMock } from './api/getTokenPrice/getTokenPrice.mock';
import getToken from './api/getToken/getToken';
import getTokenMock from './api/getToken/getToken.mock';
import submitSwap from './api/submitSwap/submitSwap';
import sendTransaction from './api/sendTransaction/sendTransaction';
import buildMultiChainSend from './api/buildMultichainSend/buildMultichainSend';
import getHistory from './api/getHistory/getHistory';
import getStakedBalance from './api/getStakedBalance/getStakedBalance';
import getETHBalance from './api/getETHBalance/getETHBalance';

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

  getToken: publicProcedure
    .input(z.object({ tokenAddress: z.string() }))
    .query(async ({ input }) => {
      return MOCK_RESPONSE
        ? getTokenMock({
            tokenAddress: input.tokenAddress as Hex,
          })
        : getToken({
            tokenAddress: input.tokenAddress as Hex,
          });
    }),

  getStakedBalance: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      return getStakedBalance({ address: input.address as Hex });
    }),

  getETHBalance: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      return getETHBalance({ address: input.address as Hex });
    }),

  submitSwap: publicProcedure.input(z.any()).mutation(async ({ input }) => {
    return submitSwap(input as SubmitSwapRequestBody);
  }),

  sendTransaction: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return sendTransaction(input as SendTransactionRequestBody);
    }),

  buildMultiChainSend: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return buildMultiChainSend(input as BuildMultiChainSendRequestBody);
    }),

  getSwapQuote: publicProcedure.input(z.any()).mutation(async ({ input }) => {
    return getSwapQuote(input as GetSwapQuoteRequestBody);
  }),

  getHistory: publicProcedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getHistory(input as GetHistoryRequestBody);
    }),

  getSupportedTokens: publicProcedure
    .input(
      z.object({
        chainIds: z.array(z.number()),
        searchTerm: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const t = st('getSupportedTokens');
      const response = MOCK_RESPONSE
        ? await getSupportedTokensMock({
            chainIds: input.chainIds,
            searchTerm: input.searchTerm,
          })
        : await getSupportedTokens({
            chainIds: input.chainIds,
            searchTerm: input.searchTerm,
          });

      /*
          const response = await relayGetCurrencies({
        chainIds: [optimism.id],
        tokenAddresses: ['10:0x4200000000000000000000000000000000000042'],
      });
      */

      ed(t);

      return response;
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
