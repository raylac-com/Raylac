import {
  RelaySwapMultiInputRequestBody,
  RelayGetQuoteResponseBody,
  GetSwapQuoteRequestBody,
} from '@raylac/shared';
import { ed, st } from '@raylac/shared-backend';
import { relayApi } from '../lib/relay';
import { Hex, hexToBigInt } from 'viem';
import getTokenBalances from './getTokenBalances';

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

const getSwapQuote = async ({
  senderAddress,
  inputTokenAddress,
  outputTokenAddress,
  amount,
  tradeType,
}: GetSwapQuoteRequestBody) => {
  const inputs = await chooseInputs({
    tokenAddress: inputTokenAddress,
    amount: hexToBigInt(amount),
    address: senderAddress,
  });

  const destinationChainId = inputs[0].chainId;

  // Get quote from Relay
  const requestBody: RelaySwapMultiInputRequestBody = {
    user: senderAddress,
    recipient: senderAddress,
    origins: inputs.map(origin => ({
      chainId: origin.chainId,
      currency: origin.tokenAddress,
      amount: origin.amount.toString(),
    })),
    destinationCurrency: outputTokenAddress,
    destinationChainId,
    partial: true,
    tradeType,
    useUserOperation: true,
  };

  const qt = st('Get quote');

  const { data: quote } = await relayApi.post<RelayGetQuoteResponseBody>(
    '/execute/swap/multi-input',
    requestBody
  );

  ed(qt);

  // Build user op

  // Get the nonce of the account

  return quote;
};

export default getSwapQuote;
