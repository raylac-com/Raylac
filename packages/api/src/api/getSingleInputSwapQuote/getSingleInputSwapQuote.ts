import {
  ApproveStep,
  ETH,
  formatTokenAmount,
  GetSingleInputSwapQuoteRequestBody,
  GetSingleInputSwapQuoteReturnType,
  RelayGetQuoteResponseBody,
  RelaySwapMultiInputRequestBody,
  SwapStep,
  TRPCErrorMessage,
} from '@raylac/shared';
import { ed, logger, st } from '@raylac/shared-backend';
import { getTokenAddressOnChain } from '../../utils';
import { getNonce } from '../../utils';
import { relayApi } from '../../lib/relay';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';
import { Hex, zeroAddress } from 'viem';

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

  const inputTokenPrice = await getTokenUsdPrice({ token: inputToken });

  if (inputTokenPrice === null) {
    throw new Error('Failed to get input token price');
  }

  const outputTokenPrice = await getTokenUsdPrice({ token: outputToken });

  if (outputTokenPrice === null) {
    throw new Error('Failed to get output token price');
  }

  const amountInFormatted = formatTokenAmount({
    amount: BigInt(amountIn),
    token: inputToken,
    tokenPriceUsd: inputTokenPrice,
  });

  const amountOutFormatted = formatTokenAmount({
    amount: BigInt(amountOut),
    token: outputToken,
    tokenPriceUsd: outputTokenPrice,
  });

  const ethPriceUsd = await getTokenUsdPrice({ token: ETH });

  if (ethPriceUsd === null) {
    throw new Error('ETH price not found');
  }

  const originChainGas = quote.fees.gas.amount;

  if (originChainGas === undefined) {
    throw new Error('originChainGas is undefined');
  }

  const originChainGasFormatted = formatTokenAmount({
    amount: BigInt(originChainGas),
    token: ETH,
    tokenPriceUsd: ethPriceUsd,
  });

  const relayerFee = quote.fees.relayer.amount;

  if (!relayerFee) {
    throw new Error('Relayer fee is undefined');
  }

  const relayerFeeCurrency = quote.fees.relayer.currency;

  if (!relayerFeeCurrency) {
    throw new Error('Relayer fee currency is undefined');
  }

  let relayerFeeToken;
  if (
    relayerFeeCurrency?.address === inputTokenAddress ||
    relayerFeeCurrency?.address === outputTokenAddress
  ) {
    relayerFeeToken = inputToken;
  } else if (relayerFeeCurrency?.address === zeroAddress) {
    relayerFeeToken = ETH;
  } else {
    throw new Error(
      `Unknown fee token ${relayerFeeCurrency?.address} for bridge send`
    );
  }

  const feeTokenPriceUsd = await getTokenUsdPrice({
    token: relayerFeeToken,
  });

  if (feeTokenPriceUsd === null) {
    throw new Error('feeTokenPriceUsd is undefined');
  }

  const relayerFeeFormatted = formatTokenAmount({
    amount: BigInt(relayerFee),
    token: relayerFeeToken,
    tokenPriceUsd: feeTokenPriceUsd,
  });

  const relayRequestId = swapStepQuote.requestId;

  return {
    approveStep,
    swapStep,
    originChainGas: originChainGasFormatted,
    amountIn: amountInFormatted,
    amountOut: amountOutFormatted,
    relayerFeeToken,
    relayerFee: relayerFeeFormatted,
    relayRequestId: relayRequestId as Hex,
  };
};

export default getSingleInputSwapQuote;
