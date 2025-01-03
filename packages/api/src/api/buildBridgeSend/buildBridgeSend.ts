import { logger } from '@raylac/shared-backend';
import {
  CrossChainSwapStep,
  ETH,
  formatBalance,
  TRPCErrorMessage,
} from '@raylac/shared';
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
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';
import { zeroAddress } from 'viem';

const buildBridgeSend = async ({
  from,
  to,
  token,
  amount,
  fromChainId,
  toChainId,
}: BuildBridgeSendRequestBody): Promise<BuildBridgeSendReturnType> => {
  const originTokenAddress = getTokenAddressOnChain(token, fromChainId);
  const destinationTokenAddress = getTokenAddressOnChain(token, toChainId);

  const requestBody: RelaySwapMultiInputRequestBody = {
    user: from,
    recipient: to,
    origins: [
      {
        chainId: fromChainId,
        currency: originTokenAddress,
        amount: amount,
      },
    ],
    destinationCurrency: destinationTokenAddress,
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

  const tokenPriceUsd = await getTokenUsdPrice({ token });

  if (tokenPriceUsd === null) {
    throw new Error('tokenPriceUsd is undefined');
  }

  const amountInFormatted = formatBalance({
    balance: BigInt(amountIn),
    token,
    tokenPriceUsd,
  });

  const amountOutFormatted = formatBalance({
    balance: BigInt(amountOut),
    token,
    tokenPriceUsd,
  });

  const ethPriceUsd = await getTokenUsdPrice({ token: ETH });

  if (ethPriceUsd === null) {
    throw new Error('ETH price not found');
  }

  const originChainGas = quote.fees.gas.amount;

  if (originChainGas === undefined) {
    throw new Error('originChainGas is undefined');
  }

  const originChainGasFormatted = formatBalance({
    balance: BigInt(originChainGas),
    token: ETH,
    tokenPriceUsd: ethPriceUsd,
  });

  const relayerFeeCurrency = quote.fees.relayer.currency;

  const relayerFeeChainId = quote.fees.relayer.currency?.chainId;

  if (relayerFeeChainId === undefined) {
    throw new Error('relayerFeeChainId is undefined');
  }

  const relayFeeAmount = quote.fees.relayer.amount;

  if (relayerFeeCurrency?.address === undefined) {
    throw new Error('relayerFeeCurrency.address is undefined');
  }

  let relayerFeeToken;
  if (
    relayerFeeCurrency?.address === originTokenAddress ||
    relayerFeeCurrency?.address === destinationTokenAddress
  ) {
    relayerFeeToken = token;
  } else if (relayerFeeCurrency?.address === zeroAddress) {
    relayerFeeToken = ETH;
  } else {
    throw new Error(
      `Unknown fee token ${relayerFeeCurrency?.address} for bridge send`
    );
  }

  if (relayFeeAmount === undefined) {
    throw new Error('relayFeeAmount ');
  }

  const feeTokenPriceUsd = await getTokenUsdPrice({
    token: relayerFeeToken,
  });

  if (feeTokenPriceUsd === null) {
    throw new Error('feeTokenPriceUsd is undefined');
  }

  const relayerServiceFeeFormatted = formatBalance({
    balance: BigInt(relayFeeAmount),
    token: relayerFeeToken,
    tokenPriceUsd: feeTokenPriceUsd,
  });

  let fromChainNonce = await getNonce({
    address: from,
    chainId: fromChainId,
  });

  const steps: CrossChainSwapStep[] = quote.steps.map(step => {
    if (step.items.length !== 1) {
      throw new Error('Expected 1 step item, got ' + step.items.length);
    }

    const item = step.items[0];

    const crossChainSendStep: CrossChainSwapStep = {
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

    return crossChainSendStep;
  });

  return {
    steps: steps,
    transfer: {
      from: from,
      to: to,
      amount: amountInFormatted,
      token,
    },
    originChainGas: originChainGasFormatted,
    relayerFeeChainId,
    relayerServiceFeeToken: relayerFeeToken,
    relayerServiceFee: relayerServiceFeeFormatted,
    amountIn: amountInFormatted,
    amountOut: amountOutFormatted,
  };
};

export default buildBridgeSend;
