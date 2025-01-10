import {
  ApproveStep,
  ETH,
  formatTokenAmount,
  GetSingleInputSwapQuoteRequestBody,
  GetSingleInputSwapQuoteReturnType,
  RelayGetQuoteRequestBody,
  RelayGetQuoteResponseBody,
  SwapStep,
  Token,
  TRPCErrorMessage,
} from '@raylac/shared';
import { ed, logger, st } from '@raylac/shared-backend';
import { getTokenAddressOnChain } from '../../utils';
import { getNonce } from '../../utils';
import { relayApi } from '../../lib/relay';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';
import { Hex } from 'viem';
import BigNumber from 'bignumber.js';

const getFeeToken = ({
  feeCurrency,
  possibleTokens,
}: {
  feeCurrency: string;
  possibleTokens: Token[];
}) => {
  const feeToken = possibleTokens.find(token =>
    token.addresses.some(
      address => address.address.toLowerCase() === feeCurrency.toLowerCase()
    )
  );

  if (!feeToken) {
    throw new Error(`Unknown fee token ${feeCurrency}`);
  }

  return feeToken;
};

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
  const requestBody: RelayGetQuoteRequestBody = {
    user: sender,
    recipient: sender,
    originChainId: inputChainId,
    destinationChainId: outputChainId,
    amount: amount.toString(),
    originCurrency: inputTokenAddress,
    destinationCurrency: outputTokenAddress,
    tradeType: 'EXACT_INPUT',
  };

  const qt = st('Get quote');

  let quote;
  try {
    const { data } = await relayApi.post<RelayGetQuoteResponseBody>(
      '/quote',
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

  const swapStepQuote = quote.steps.find(
    step => step.id === 'deposit' || step.id === 'swap'
  );

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

  const relayerGas = quote.fees.relayerGas.amount;

  if (!relayerGas) {
    throw new Error('Relayer gas is undefined');
  }

  const relayGasCurrency = quote.fees.relayerGas.currency?.address;

  if (!relayGasCurrency) {
    throw new Error('Relay gas currency is undefined');
  }

  const relayerGasToken = getFeeToken({
    feeCurrency: relayGasCurrency,
    possibleTokens: [inputToken, outputToken, ETH],
  });

  const relayerServiceFeeCurrency = quote.fees.relayer.currency?.address;

  if (!relayerServiceFeeCurrency) {
    throw new Error('Relayer fee currency is undefined');
  }

  const relayerServiceFeeToken = getFeeToken({
    feeCurrency: relayerServiceFeeCurrency,
    possibleTokens: [inputToken, outputToken, ETH],
  });

  const feeTokenPriceUsd = await getTokenUsdPrice({
    token: relayerServiceFeeToken,
  });

  if (feeTokenPriceUsd === null) {
    throw new Error('feeTokenPriceUsd is undefined');
  }

  const relayerGasFormatted = formatTokenAmount({
    amount: BigInt(relayerGas),
    token: relayerGasToken,
    tokenPriceUsd: feeTokenPriceUsd,
  });

  const relayerServiceFee = quote.fees.relayerService.amount;

  if (!relayerServiceFee) {
    throw new Error('Relayer fee is undefined');
  }

  const relayerServiceFeeFormatted = formatTokenAmount({
    amount: BigInt(relayerServiceFee),
    token: relayerServiceFeeToken,
    tokenPriceUsd: feeTokenPriceUsd,
  });

  const totalFeeUsdFormatted = new BigNumber(
    relayerServiceFeeFormatted.usdValueFormatted
  )
    .plus(relayerGasFormatted.usdValueFormatted)
    .plus(originChainGasFormatted.usdValueFormatted)
    .toString();

  const relayRequestId = swapStepQuote.requestId;

  return {
    approveStep,
    swapStep,
    originChainGas: originChainGasFormatted,
    amountIn: amountInFormatted,
    amountOut: amountOutFormatted,
    relayerGasToken,
    relayerGas: relayerGasFormatted,
    relayerServiceFeeToken,
    relayerServiceFee: relayerServiceFeeFormatted,
    relayRequestId: relayRequestId as Hex,
    totalFeeUsd: totalFeeUsdFormatted,
    fromChainId: inputChainId,
    toChainId: outputChainId,
  };
};

export default getSingleInputSwapQuote;
