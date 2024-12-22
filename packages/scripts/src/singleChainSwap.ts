import {
  Hex,
  parseEther,
  parseUnits,
  publicActions,
  toHex,
  zeroAddress,
} from 'viem';
import { client } from './rpc';
import { arbitrum, base, optimism } from 'viem/chains';
import {
  hdKeyToAccount,
  mnemonicToAccount,
  HDKey,
  privateKeyToAccount,
} from 'viem/accounts';
import { TRPCError } from '@trpc/server';
import {
  ETH,
  getPublicClient,
  GetSingleChainSwapQuoteRequestBody,
  getWalletClient,
  WST_ETH,
} from '@raylac/shared';

const swap = async () => {
  const sender = '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8';

  const swapAmount = parseUnits('0.001', 18);

  const requestBody: GetSingleChainSwapQuoteRequestBody = {
    sender: sender,
    inputToken: WST_ETH,
    outputToken: ETH,
    amount: swapAmount.toString(),
    chainId: base.id,
  };

  const quote = await client.getSingleChainSwapQuote.mutate(requestBody);

  console.log('quote');
  console.log(JSON.stringify(quote, null, 2));
};

swap();
