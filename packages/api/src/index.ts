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
  BuildMultiChainSendRequestBody,
  BuildSwapUserOpRequestBody,
  GetSwapQuoteRequestBody,
  SendTransactionRequestBody,
  SubmitSwapRequestBody,
  SubmitUserOpsRequestBody,
} from '@raylac/shared';
import getSwapQuote from './api/getSwapQuote/getSwapQuote';
import { ed, logger, st } from '@raylac/shared-backend';
import getSwapQuoteMock from './api/getSwapQuote/getSwapQuote.mock';
import buildSwapUserOpMock from './api/buildSwapUserOp/buildSwapUserOp.mock';
import submitUserOpsMock from './api/submitUserOps/submitUserOps.mock';
import getTokenPrice from './api/getTokenPrice/getTokenPrice';
import { getTokenPriceMock } from './api/getTokenPrice/getTokenPrice.mock';
import getSwapHistory from './api/getSwapHistory/getSwapHistory';
import getSwapHistoryMock from './api/getSwapHistory/getSwapHistory.mock';
import getToken from './api/getToken/getToken';
import getTokenMock from './api/getToken/getToken.mock';
import submitSwap from './api/submitSwap/submitSwap';
import sendTransaction from './api/sendTransaction/sendTransaction';
import buildMultiChainSend from './api/buildMultichainSend/buildMultichainSend';

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

  submitSwap: publicProcedure
    .input(
      z.object({
        swapQuote: z.any(),
        signedTxs: z.array(
          z.object({
            chainId: z.number(),
            signedTx: z.string(),
            sender: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return submitSwap(input as SubmitSwapRequestBody);
    }),

  submitUserOps: publicProcedure
    .input(
      z.object({
        userOps: z.array(z.any()),
        swapQuote: z.any(),
        inputs: z.array(z.any()),
        output: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      return MOCK_RESPONSE
        ? submitUserOpsMock(input as SubmitUserOpsRequestBody)
        : submitUserOps(input as SubmitUserOpsRequestBody);
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
    return MOCK_RESPONSE
      ? getSwapQuoteMock(input as GetSwapQuoteRequestBody)
      : getSwapQuote(input as GetSwapQuoteRequestBody);
  }),

  getSwapHistory: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      return MOCK_RESPONSE
        ? getSwapHistoryMock()
        : getSwapHistory({ address: input.address as Hex });
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
