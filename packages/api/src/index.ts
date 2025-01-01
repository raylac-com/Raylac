import 'dotenv/config';
import { z } from 'zod';
import { publicProcedure, router, createCallerFactory } from './trpc';
import { createContext } from './context';
import { webcrypto } from 'node:crypto';
import getTokenBalances from './api/getTokenBalances/getTokenBalances';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { Hex } from 'viem';
import getSupportedTokens from './api/getSupportedTokens/getSupportedTokens';
import getSupportedTokensMock from './api/getSupportedTokens/getSupportedTokens.mock';
import {
  BuildAggregateSendRequestBody,
  BuildMultiChainSendRequestBody,
  GetHistoryRequestBody,
  GetSingleChainSwapQuoteRequestBody,
  GetSingleInputSwapQuoteRequestBody,
  SendAggregateTxRequestBody,
  GetSwapQuoteRequestBody,
  SendTransactionRequestBody,
  SubmitSingleChainSwapRequestBody,
  SubmitSingleInputSwapRequestBody,
  SubmitSwapRequestBody,
  GetEstimatedTransferGasRequestBody,
  BuildBridgeSendRequestBody,
  Token,
} from '@raylac/shared';
import buildAggregateSend from './api/buildAggregateSend/buildAggregateSend';
import getSwapQuote from './api/getSwapQuote/getSwapQuote';
import { ed, logger, st } from '@raylac/shared-backend';
import getTokenPrice from './api/getTokenPrice/getTokenPrice';
import { getTokenPriceMock } from './api/getTokenPrice/getTokenPrice.mock';
import submitSwap from './api/submitSwap/submitSwap';
import sendTransaction from './api/sendTransaction/sendTransaction';
import buildMultiChainSend from './api/buildMultichainSend/buildMultichainSend';
import getHistory from './api/getHistory/getHistory';
import getSingleChainSwapQuote from './api/getSingleChainSwapQuote/getSingleChainSwapQuote';
import submitSingleChainSwap from './api/submitSingleChainSwap/submitSingleChainSwap';
import getLidoApy from './api/getLidoApy/getLidoApy';
import getSingleInputSwapQuote from './api/getSingleInputSwapQuote/getSingleInputSwapQuote';
import submitSingleInputSwap from './api/submitSingleInputSwap/submitSingleInputSwap';
import sendAggregateTx from './api/sendAggregateTx/sendAggregateTx';
import getEstimatedTransferGas from './api/getEstimatedTransferGas/getEstimatedTransferGas';
import buildBridgeSend from './api/buildBridgeSend/buildBridgeSend';

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
        addresses: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      return getTokenBalances({ addresses: input.addresses as Hex[] });
    }),

  getLidoApy: publicProcedure.query(async () => {
    return getLidoApy();
  }),

  submitSwap: publicProcedure.input(z.any()).mutation(async ({ input }) => {
    return submitSwap(input as SubmitSwapRequestBody);
  }),

  submitSingleChainSwap: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return submitSingleChainSwap(input as SubmitSingleChainSwapRequestBody);
    }),

  submitSingleInputSwap: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return submitSingleInputSwap(input as SubmitSingleInputSwapRequestBody);
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

  buildAggregateSend: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return buildAggregateSend(input as BuildAggregateSendRequestBody);
    }),

  buildBridgeSend: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return buildBridgeSend(input as BuildBridgeSendRequestBody);
    }),

  sendAggregateTx: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return sendAggregateTx(input as SendAggregateTxRequestBody);
    }),

  getSwapQuote: publicProcedure.input(z.any()).mutation(async ({ input }) => {
    return getSwapQuote(input as GetSwapQuoteRequestBody);
  }),

  getSingleChainSwapQuote: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return getSingleChainSwapQuote(
        input as GetSingleChainSwapQuoteRequestBody
      );
    }),

  getSingleInputSwapQuote: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return getSingleInputSwapQuote(
        input as GetSingleInputSwapQuoteRequestBody
      );
    }),

  getHistory: publicProcedure
    .input(
      z.object({
        addresses: z.array(z.string()),
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
    .input(z.object({ token: z.any() }))
    .mutation(async ({ input }) => {
      return MOCK_RESPONSE
        ? getTokenPriceMock({
            token: input.token as Token,
          })
        : getTokenPrice({
            token: input.token as Token,
          });
    }),

  getEstimatedTransferGas: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return getEstimatedTransferGas(
        input as GetEstimatedTransferGasRequestBody
      );
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

  // We need this to accept requests from the web app
  middleware: (req, res, next) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    return next();
  },
});

server.listen(3000);
