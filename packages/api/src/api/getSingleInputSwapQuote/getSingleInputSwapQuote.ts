import {
  ApproveStep,
  formatAmount,
  formatUsdValue,
  GetSingleInputSwapQuoteRequestBody,
  GetSingleInputSwapQuoteReturnType,
  RelayGetQuoteResponseBody,
  RelaySwapMultiInputRequestBody,
  SwapStep,
  TRPCErrorMessage,
} from '@raylac/shared';
import { ed, logger, st } from '@raylac/shared-backend';
import { getTokenAddressOnChain } from '../../utils';
import BigNumber from 'bignumber.js';
import { getNonce } from '../../lib/utils';
import { relayApi } from '../../lib/relay';
import { TRPCError } from '@trpc/server';
import axios from 'axios';

const getSingleInputSwapQuote = async ({
  sender,
  amount,
  inputToken,
  outputToken,
  inputChainId,
  outputChainId,
}: GetSingleInputSwapQuoteRequestBody): Promise<GetSingleInputSwapQuoteReturnType> => {
  const inputTokenAddress = getTokenAddressOnChain(inputToken, inputChainId);
  const outputTokenAddress = getTokenAddressOnChain(outputToken, outputChainId);

  // Get quote from Relay
  const requestBody: RelaySwapMultiInputRequestBody = {
    user: sender,
    recipient: sender,
    origins: [
      {
        chainId: inputChainId,
        currency: inputTokenAddress,
        amount: amount.toString(),
      },
    ],
    destinationCurrency: outputTokenAddress,
    destinationChainId: outputChainId,
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
    address: sender,
    chainId: inputChainId,
  });

  const approveStepQuote = quote.steps.find(step => step.id === 'approve');

  let approveStep: ApproveStep | null = null;
  if (approveStepQuote) {
    const approveStepItem = approveStepQuote.items[0];

    approveStep = {
      tx: {
        data: approveStepItem.data.data,
        to: approveStepItem.data.to,
        value: approveStepItem.data.value,
        maxFeePerGas: approveStepItem.data.maxFeePerGas,
        maxPriorityFeePerGas: approveStepItem.data.maxPriorityFeePerGas,
        chainId: approveStepItem.data.chainId,
        gas: approveStepItem.data.gas ?? 300_000,
        nonce,
      },
    };

    nonce++;
  }

  const swapStepQuote = quote.steps.find(step => step.id === 'swap');

  if (!swapStepQuote) {
    throw new Error('Swap step not found');
  }

  if (swapStepQuote.items.length !== 1) {
    throw new Error(
      'Expected 1 swap step item, got ' + swapStepQuote.items.length
    );
  }

  const swapStepItem = swapStepQuote.items[0];

  const swapStep: SwapStep = {
    originChainId: swapStepItem.data.chainId,
    destinationChainId: swapStepItem.data.chainId,
    tx: {
      data: swapStepItem.data.data,
      to: swapStepItem.data.to,
      value: swapStepItem.data.value,
      maxFeePerGas: swapStepItem.data.maxFeePerGas,
      maxPriorityFeePerGas: swapStepItem.data.maxPriorityFeePerGas,
      chainId: swapStepItem.data.chainId,
      gas: swapStepItem.data.gas ?? 300_000,
      nonce: nonce,
    },
  };

  const amountIn = amount;
  const amountOut = quote.details.currencyOut.amount;

  const amountInFormatted = formatAmount(amountIn, inputToken.decimals);
  const amountOutFormatted = formatAmount(amountOut, outputToken.decimals);

  const amountInUsd = formatUsdValue(
    new BigNumber(quote.details.currencyIn.amountUsd)
  );
  const amountOutUsd = formatUsdValue(
    new BigNumber(quote.details.currencyOut.amountUsd)
  );

  const originChainGasAmountFormatted = quote.fees.gas.amountFormatted;

  if (originChainGasAmountFormatted === undefined) {
    throw new Error('Origin chain gas amount is undefined');
  }

  const originChainGasUsd = quote.fees.gas.amountUsd;

  if (originChainGasUsd === undefined) {
    throw new Error('Origin chain gas usd is undefined');
  }

  const relayerServiceFeeUsd = quote.fees.relayerService.amountUsd;

  if (relayerServiceFeeUsd === undefined) {
    throw new Error('Relay service fee is undefined');
  }

  const relayerServiceFeeUsdFormatted = formatUsdValue(
    new BigNumber(relayerServiceFeeUsd)
  );

  return {
    approveStep,
    swapStep,
    amountIn,
    amountOut,
    amountInFormatted,
    amountOutFormatted,
    amountInUsd,
    amountOutUsd,
    relayerServiceFeeUsd: relayerServiceFeeUsdFormatted,
    originChainGasAmountFormatted,
    originChainGasUsd: formatUsdValue(new BigNumber(originChainGasUsd)),
  };
};

export default getSingleInputSwapQuote;
