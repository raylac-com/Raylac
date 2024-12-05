import {
  RelaySwapMultiInputRequestBody,
  RelayGetQuoteResponseBody,
  GetSwapQuoteRequestBody,
  TRPCErrorMessage,
} from '@raylac/shared';
import { ed, logger, st } from '@raylac/shared-backend';
import { relayApi } from '../../lib/relay';
import { hexToBigInt } from 'viem';
// import getTokenBalances from '../getTokenBalances/getTokenBalances';
import { base } from 'viem/chains';
import axios from 'axios';
import { TRPCError } from '@trpc/server';

/*
const chooseInputs = async ({
  tokenAddress,
  amount,
  address,
}: {
  tokenAddress: Hex;
  address: Hex;
  amount: bigint;
}) => {
  const allTokenBalances = await getTokenBalances({ address });

  const inputTokenBalances = allTokenBalances.find(token =>
    token.breakdown.some(breakdown => breakdown.tokenAddress === tokenAddress)
  );

  if (!inputTokenBalances) {
    throw new Error('No input token balances found');
  }

  let remainingAmount = amount;

  const sortedBreakdown = inputTokenBalances.breakdown.sort((a, b) =>
    hexToBigInt(b.balance) - hexToBigInt(a.balance) > 0n ? 1 : -1
  );

  const inputs = [];
  for (const breakdown of sortedBreakdown) {
    if (remainingAmount === 0n) {
      break;
    }
    const balance = hexToBigInt(breakdown.balance);

    const amountToUse = balance < remainingAmount ? balance : remainingAmount;

    remainingAmount -= amountToUse;

    inputs.push({
      chainId: breakdown.chainId,
      tokenAddress: breakdown.tokenAddress,
      amount: amountToUse,
    });
  }

  return inputs;
};
*/

const getSwapQuote = async ({
  senderAddress,
  inputTokenAddress,
  outputTokenAddress,
  amount,
  tradeType,
}: GetSwapQuoteRequestBody) => {
  /*
  const inputs = await chooseInputs({
    tokenAddress: inputTokenAddress,
    amount: hexToBigInt(amount),
    address: senderAddress,
  });
  */

  //  const destinationChainId = inputs[0].chainId;
  const destinationChainId = base.id;

  // Get quote from Relay
  const requestBody: RelaySwapMultiInputRequestBody = {
    user: senderAddress,
    recipient: senderAddress,
    origins: [
      {
        chainId: base.id,
        currency: inputTokenAddress,
        amount: hexToBigInt(amount).toString(),
      },
    ],
    destinationCurrency: outputTokenAddress,
    destinationChainId,
    partial: true,
    tradeType,
    useUserOperation: true,
  };

  logger.info('requestBody', requestBody);

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

      logger.error('Relay API error:', error.response?.data || error.message);
    }
    throw error;
  }

  ed(qt);
  // Build user op

  // Get the nonce of the account

  return quote;
};

export default getSwapQuote;
