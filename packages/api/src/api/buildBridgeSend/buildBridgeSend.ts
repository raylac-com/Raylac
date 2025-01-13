import { logger } from '@raylac/shared-backend';
import {
  DepositStep,
  ETH,
  formatAmount,
  formatTokenAmount,
  formatUsdValue,
  RelayGasFee,
  RelayGetQuoteRequestBody,
  Token,
  TokenAmount,
  TRPCErrorMessage,
} from '@raylac/shared';
import { TRPCError } from '@trpc/server';
import {
  BuildBridgeSendReturnType,
  BuildBridgeSendRequestBody,
  RelayGetQuoteResponseBody,
  getTokenAddressOnChain,
} from '@raylac/shared';
import { relayApi } from '../../lib/relay';
import axios from 'axios';
import { getNonce } from '../../utils';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';
import { Hex } from 'viem';
import BigNumber from 'bignumber.js';

/**
 * Parses a relayer fee into a `TokenAmount` and `Token`
 */
const parseRelayerFee = ({
  fee,
  possibleTokens,
}: {
  fee: RelayGasFee;
  possibleTokens: Token[];
}): { amount: TokenAmount; token: Token } => {
  const amount = fee.amount;

  if (amount === undefined) {
    throw new Error('Fee amount is undefined');
  }

  const amountUsd = fee.amountUsd;

  if (amountUsd === undefined) {
    throw new Error('Fee amountUsd is undefined');
  }

  const currency = fee.currency;

  if (currency === undefined) {
    throw new Error('Fee currency is undefined');
  }

  const decimals = currency.decimals;

  if (decimals === undefined) {
    throw new Error('Fee currency decimals is undefined');
  }

  const currencyAddress = currency.address;

  if (currencyAddress === undefined) {
    throw new Error('Fee currency address is undefined');
  }

  const token = possibleTokens.find(token =>
    Object.values(token.addresses).some(
      address => address.address.toLowerCase() === currencyAddress.toLowerCase()
    )
  );

  if (!token) {
    throw new Error(
      `Token not found for fee currency ${currencyAddress.toLowerCase()}`
    );
  }

  // Compute the usd price from the usd value and the amount returned from Relay

  const tokenUsdPrice = new BigNumber(amountUsd)
    .div(new BigNumber(formatAmount(amount, decimals)))
    .toNumber();

  const tokenAmount = formatTokenAmount({
    amount: BigInt(amount),
    token,
    tokenPrice: {
      usd: tokenUsdPrice.toString(),
      jpy: (tokenUsdPrice * 140).toString(),
    },
  });

  return { amount: tokenAmount, token };
};

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

  const requestBody: RelayGetQuoteRequestBody = {
    user: from,
    recipient: to,
    originCurrency: originTokenAddress,
    originChainId: fromChainId,
    amount: amount,
    destinationCurrency: destinationTokenAddress,
    destinationChainId: toChainId,
    tradeType: 'EXACT_INPUT',
  };

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

  const amountIn = amount;
  const amountOut = quote.details.currencyOut.amount;

  const tokenPriceUsd = await getTokenUsdPrice({ token });

  if (tokenPriceUsd === null) {
    throw new Error('tokenPriceUsd is undefined');
  }

  const amountInFormatted = formatTokenAmount({
    amount: BigInt(amountIn),
    token,
    tokenPrice: {
      usd: tokenPriceUsd.toString(),
      jpy: (tokenPriceUsd * 140).toString(),
    },
  });

  const amountOutFormatted = formatTokenAmount({
    amount: BigInt(amountOut),
    token,
    tokenPrice: {
      usd: tokenPriceUsd.toString(),
      jpy: (tokenPriceUsd * 140).toString(),
    },
  });

  const ethPriceUsd = await getTokenUsdPrice({ token: ETH });

  if (ethPriceUsd === null) {
    throw new Error('ETH price not found');
  }

  const originChainGas = parseRelayerFee({
    fee: quote.fees.gas,
    possibleTokens: [token, ETH],
  });

  const relayerServiceFee = parseRelayerFee({
    fee: quote.fees.relayerService,
    possibleTokens: [token, ETH],
  });

  const relayerGas = parseRelayerFee({
    fee: quote.fees.relayerGas,
    possibleTokens: [token, ETH],
  });

  const relayerServiceFeeChainId = quote.fees.relayerService.currency?.chainId;

  if (relayerServiceFeeChainId === undefined) {
    throw new Error('Relayer fee chain id is undefined');
  }

  const relayerGasChainId = quote.fees.relayerGas.currency?.chainId;

  if (relayerGasChainId === undefined) {
    throw new Error('Relayer gas chain id is undefined');
  }

  let fromChainNonce = await getNonce({
    address: from,
    chainId: fromChainId,
  });

  const steps: DepositStep[] = quote.steps.map(step => {
    if (step.items.length !== 1) {
      throw new Error('Expected 1 step item, got ' + step.items.length);
    }

    const item = step.items[0];

    // Create the step with the correct id type
    const depositStep: DepositStep = {
      id: (step.id === 'swap' ? 'deposit' : step.id) as 'deposit' | 'approve',
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

    return depositStep;
  });

  const depositStep = quote.steps.find(step => step.id === 'deposit');

  if (!depositStep) {
    throw new Error('Swap step not found');
  }
  const totalFeeUsd = formatUsdValue(
    new BigNumber(relayerServiceFee.amount.currencyValue.raw.usd)
      .plus(new BigNumber(relayerGas.amount.currencyValue.raw.usd))
      .plus(new BigNumber(originChainGas.amount.currencyValue.raw.usd))
  );

  return {
    relayRequestId: depositStep.requestId as Hex,
    steps: steps,
    transfer: {
      from: from,
      to: to,
      amount: amountInFormatted,
      token,
    },
    originChainGas: originChainGas.amount,
    relayerGas: relayerGas.amount,
    relayerServiceFee: relayerServiceFee.amount,
    relayerGasToken: relayerGas.token,
    relayerServiceFeeToken: relayerServiceFee.token,
    relayerServiceFeeChainId,
    relayerGasChainId,
    amountIn: amountInFormatted,
    amountOut: amountOutFormatted,
    totalFeeUsd,
    fromChainId,
    toChainId,
  };
};

export default buildBridgeSend;
