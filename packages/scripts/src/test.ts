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
  supportedChains,
  TokenBalancesReturnType,
  TRPCErrorMessage,
  UserOperation,
} from '@raylac/shared';

const test = async () => {
  const supportedTokens = await client.getSupportedTokens.query({
    chainIds: supportedChains.map(chain => chain.id),
  });

  console.log(supportedTokens.length);

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

  const tokenBalances = await client.getTokenBalances.query({
    address: sender,
  });
  console.log(tokenBalances);

  console.log(sender);

  const inputToken = supportedTokens.find(token => token.symbol === 'DEGEN');
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
    amount: parseUnits('30', 18),
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
  console.log(quote.fees.relayerService);
};

test();
