import { parseEther, parseUnits, toHex, zeroAddress } from 'viem';
import { client } from './rpc';
import { arbitrum, base, optimism } from 'viem/chains';
import { hdKeyToAccount, mnemonicToAccount, signMessage } from 'viem/accounts';
import { TRPCError } from '@trpc/server';
import {
  buildSwapIo,
  getSenderAddressV2,
  GetSwapQuoteRequestBody,
  getUserOpHash,
  getWalletClient,
  TokenBalancesReturnType,
  TRPCErrorMessage,
  UserOperation,
} from '@raylac/shared';

const test = async () => {
  const supportedTokens = await client.getSupportedTokens.query({
    chainIds: [optimism.id, base.id],
  });

  const account = mnemonicToAccount(
    'rain profit typical section elephant expire curious defy basic despair toy scene'
  );

  const hdKey = account.getHdKey();

  const spendingAccount = hdKeyToAccount(hdKey, {
    accountIndex: 0,
  });

  const singerAddress = spendingAccount.address;

  const sender = getSenderAddressV2({
    singerAddress,
  });

  console.log(sender);

  const tokenBalances = await client.getTokenBalances.query({
    address: sender,
  });

  const inputToken = supportedTokens.find(token => token.symbol === 'USDC');
  const outputToken = supportedTokens.find(token => token.symbol === 'ETH');

  console.log(inputToken, outputToken);

  if (!inputToken) {
    throw new Error('Input token not found');
  }

  if (!outputToken) {
    throw new Error('Output token not found');
  }

  const inputTokenBalance = tokenBalances.find(
    token => token.symbol === inputToken.symbol
  );

  if (!inputTokenBalance) {
    throw new Error('Input token balance not found');
  }

  const { inputs, output } = buildSwapIo({
    inputToken,
    outputToken,
    amount: parseUnits('1', 6),
    inputTokenBalance,
  });

  console.log(inputs, output);

  const requestBody: GetSwapQuoteRequestBody = {
    senderAddress: sender,
    inputs: inputs.map(input => ({
      ...input,
      amount: toHex(input.amount),
    })),
    output,
    tradeType: 'EXACT_INPUT',
  };

  const quote = await client.getSwapQuote.mutate(requestBody);
  console.log(quote);
};

test();
