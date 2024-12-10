import {
  RelaySwapMultiInputRequestBody,
  RelayGetQuoteResponseBody,
  GetSwapQuoteRequestBody,
  TRPCErrorMessage,
} from '@raylac/shared';
import { ed, logger, st } from '@raylac/shared-backend';
import { relayApi } from '../../lib/relay';
import { hexToBigInt } from 'viem';
import axios from 'axios';
import { TRPCError } from '@trpc/server';

const getSwapQuote = async ({
  senderAddress,
  inputs,
  output,
  tradeType,
}: GetSwapQuoteRequestBody) => {
  const destinationChainId = output.chainId;

  // Convert GetSwapQuoteRequestBody["inputs"] to RelaySwapMultiInputRequestBody["origins"]
  const origins = inputs.map(input => {
    const chainTokenAddress = input.token.addresses.find(
      address => address.chainId === input.chainId
    )?.address;

    if (!chainTokenAddress) {
      throw new Error(
        `getSwapQuote: chainTokenAddress not found for ${input.token.name} on chain ${input.chainId}`
      );
    }

    return {
      chainId: input.chainId,
      currency: chainTokenAddress,
      amount: hexToBigInt(input.amount).toString(),
    };
  });

  // Convert GetSwapQuoteRequestBody["output"] to RelaySwapMultiInputRequestBody["destinationCurrency"]
  const outputTokenAddress = output.token.addresses.find(
    address => address.chainId === output.chainId
  )?.address;

  if (!outputTokenAddress) {
    throw new Error(
      `getSwapQuote: outputTokenAddress not found for ${output.token.name} on chain ${output.chainId}`
    );
  }

  // Get quote from Relay
  // Get quote from Relay
  const requestBody: RelaySwapMultiInputRequestBody = {
    user: senderAddress,
    recipient: senderAddress,
    origins,
    destinationCurrency: outputTokenAddress,
    destinationChainId,
    partial: true,
    tradeType,
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

  return quote;
};

export default getSwapQuote;
