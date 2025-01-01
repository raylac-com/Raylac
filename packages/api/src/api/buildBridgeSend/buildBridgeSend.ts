import { logger } from '@raylac/shared-backend';

import { CrossChainSwapStep, TRPCErrorMessage } from '@raylac/shared';

import { TRPCError } from '@trpc/server';

import {
  BuildBridgeSendReturnType,
  BuildBridgeSendRequestBody,
  RelayGetQuoteResponseBody,
  RelaySwapMultiInputRequestBody,
  getTokenAddressOnChain,
} from '@raylac/shared';
import { relayApi } from '../../lib/relay';
import axios from 'axios';
import { getNonce } from '../../lib/utils';
import { formatUnits } from 'viem';

const buildBridgeSend = async ({
  from,
  to,
  token,
  amount,
  fromChainId,
  toChainId,
}: BuildBridgeSendRequestBody): Promise<BuildBridgeSendReturnType> => {
  const requestBody: RelaySwapMultiInputRequestBody = {
    user: from,
    recipient: to,
    origins: [
      {
        chainId: fromChainId,
        currency: getTokenAddressOnChain(token, fromChainId),
        amount: amount,
      },
    ],
    destinationCurrency: getTokenAddressOnChain(token, toChainId),
    destinationChainId: toChainId,
    partial: false,
    tradeType: 'EXACT_INPUT',
    useUserOperation: false,
  };

  let quote;
  try {
    const { data } = await relayApi.post<RelayGetQuoteResponseBody>(
      '/execute/swap/multi-input',
      requestBody
    );
    quote = data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message?.includes('amount is too small')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: TRPCErrorMessage.SWAP_AMOUNT_TOO_SMALL,
          cause: error,
        });
      }

      if (
        error.response?.data?.message?.includes(
          'No routes found for the requested swap'
        )
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: TRPCErrorMessage.SWAP_NO_ROUTES_FOUND,
          cause: error,
        });
      }

      if (
        error.response?.data?.message?.includes(
          'Solver has insufficient liquidity for this swap'
        )
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: TRPCErrorMessage.SWAP_INSUFFICIENT_LIQUIDITY,
          cause: error,
        });
      }

      logger.error('Relay API error:', error.response?.data || error.message);
    }
    throw error;
  }

  const amountIn = amount;
  const amountOut = quote.details.currencyOut.amount;

  const amountInFormatted = formatUnits(BigInt(amountIn), token.decimals);
  const amountOutFormatted = formatUnits(BigInt(amountOut), token.decimals);

  const amountInUsd = quote.details.currencyIn.amountUsd;
  const amountOutUsd = quote.details.currencyOut.amountUsd;

  const relayerServiceFeeAmount = quote.fees.relayerService.amount;
  const relayerServiceFeeUsd = quote.fees.relayerService.amountUsd;

  if (relayerServiceFeeAmount === undefined) {
    throw new Error('relayerServiceFeeAmount ');
  }

  if (relayerServiceFeeUsd === undefined) {
    throw new Error('relayerServiceFeeUsd is undefined');
  }

  let fromChainNonce = await getNonce({
    address: from,
    chainId: fromChainId,
  });

  const steps: CrossChainSwapStep[] = quote.steps.map(step => {
    if (step.items.length !== 1) {
      throw new Error('Expected 1 step item, got ' + step.items.length);
    }

    const item = step.items[0];

    const crossChainSwapStep: CrossChainSwapStep = {
      originChainId: item.data.chainId,
      destinationChainId: item.data.chainId,
      id: step.id as 'swap' | 'approve',
      tx: {
        data: item.data.data,
        to: item.data.to,
        value: item.data.value,
        maxFeePerGas: item.data.maxFeePerGas,
        maxPriorityFeePerGas: item.data.maxPriorityFeePerGas,
        chainId: item.data.chainId,
        gas: item.data.gas ?? 800_000,
        nonce: fromChainNonce,
      },
    };

    fromChainNonce++;

    return crossChainSwapStep;
  });

  return {
    steps: steps,
    relayerServiceFeeAmount: relayerServiceFeeAmount.toString(),
    relayerServiceFeeUsd: relayerServiceFeeUsd.toString(),
    amountIn,
    amountOut,
    amountInFormatted,
    amountOutFormatted,
    amountInUsd,
    amountOutUsd,
  };
};

export default buildBridgeSend;
