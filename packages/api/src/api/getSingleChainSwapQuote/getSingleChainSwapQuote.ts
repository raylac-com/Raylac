import {
  RelaySwapMultiInputRequestBody,
  RelayGetQuoteResponseBody,
  TRPCErrorMessage,
  CrossChainSwapStep,
  GetSingleChainSwapQuoteReturnType,
  GetSingleChainSwapQuoteRequestBody,
  formatAmount,
} from '@raylac/shared';
import { ed, logger, st } from '@raylac/shared-backend';
import { relayApi } from '../../lib/relay';
import axios from 'axios';
import { TRPCError } from '@trpc/server';
import { getTokenAddressOnChain } from '../../utils';
import { getNonce } from '../../lib/utils';

const getSingleChainSwapQuote = async ({
  sender,
  amount,
  inputToken,
  outputToken,
  chainId,
}: GetSingleChainSwapQuoteRequestBody): Promise<GetSingleChainSwapQuoteReturnType> => {
  const inputTokenAddress = getTokenAddressOnChain(inputToken, chainId);
  const outputTokenAddress = getTokenAddressOnChain(outputToken, chainId);

  const origins: RelaySwapMultiInputRequestBody['origins'] = [
    {
      chainId,
      currency: inputTokenAddress,
      amount,
    },
  ];

  // Get quote from Relay
  // Get quote from Relay
  const requestBody: RelaySwapMultiInputRequestBody = {
    user: sender,
    recipient: sender,
    origins,
    destinationCurrency: outputTokenAddress,
    destinationChainId: chainId,
    partial: false,
    tradeType: 'EXACT_INPUT',
    useUserOperation: false,
  };

  const qt = st('Get quote');

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

  ed(qt);

  let nonce = await getNonce({
    chainId,
    address: sender,
  });

  const swapSteps: CrossChainSwapStep[] = quote.steps.map(step => {
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
        gas: item.data.gas ?? 300_000,
        nonce,
      },
    };

    nonce++;

    return crossChainSwapStep;
  });

  const amountIn = amount;
  const amountOut = quote.details.currencyOut.amount;

  const amountInFormatted = formatAmount(amountIn, inputToken.decimals);
  const amountOutFormatted = formatAmount(amountOut, outputToken.decimals);

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

  return {
    swapSteps,
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

export default getSingleChainSwapQuote;
