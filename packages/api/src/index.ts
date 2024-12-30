import 'dotenv/config';
import { z } from 'zod';
import { publicProcedure, router, createCallerFactory } from './trpc';
import { createContext } from './context';
import { webcrypto } from 'node:crypto';
import getTokenBalances, {
  getETHBalance,
} from './api/getTokenBalances/getTokenBalances';
import getTokenBalancesMock from './api/getTokenBalances/getTokenBalances.mock';
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
  TokenSet,
} from '@raylac/shared';
import buildAggregateSend from './api/buildAggregateSend/buildAggregateSend';
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
import getSingleChainSwapQuote from './api/getSingleChainSwapQuote/getSingleChainSwapQuote';
import submitSingleChainSwap from './api/submitSingleChainSwap/submitSingleChainSwap';
import getLidoApy from './api/getLidoApy/getLidoApy';
import getSetBalances from './api/getSetBalances/getSetBalances';
import getSet from './api/getSet/getSet';
import getSingleInputSwapQuote from './api/getSingleInputSwapQuote/getSingleInputSwapQuote';
import submitSingleInputSwap from './api/submitSingleInputSwap/submitSingleInputSwap';
import sendAggregateTx from './api/sendAggregateTx/sendAggregateTx';

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
      return MOCK_RESPONSE
        ? getTokenBalancesMock({ addresses: input.addresses as Hex[] })
        : getTokenBalances({ addresses: input.addresses as Hex[] });
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

  getETHBalance: publicProcedure
    .input(z.object({ address: z.string(), chainId: z.number() }))
    .query(async ({ input }) => {
      return getETHBalance({
        address: input.address as Hex,
        chainId: input.chainId,
      });
    }),

  getSetBalances: publicProcedure
    .input(
      z.object({ set: z.nativeEnum(TokenSet), addresses: z.array(z.string()) })
    )
    .query(async ({ input }) => {
      return getSetBalances({
        set: input.set as TokenSet,
        addresses: input.addresses as Hex[],
      });
    }),

  getSet: publicProcedure
    .input(z.object({ set: z.nativeEnum(TokenSet) }))
    .query(async ({ input }) => {
      return getSet(input.set as TokenSet);
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
