import { Hex, parseEther, parseUnits, toHex, zeroAddress } from 'viem';
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
  getGasInfo,
  getPublicClient,
  getSenderAddressV2,
  GetSwapQuoteRequestBody,
  getUserOpHash,
  getWalletClient,
  SignedCrossChainSwapStep,
  signEIP1159Tx,
  SubmitSwapRequestBody,
} from '@raylac/shared';
import * as bip39 from 'bip39';

const swap = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );

  const sender = account.address;

  const inputToken = await client.getToken.query({
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  });

  const outputToken = await client.getToken.query({
    tokenAddress: zeroAddress,
  });

  const swapAmount = parseUnits('1', 6);

  const requestBody: GetSwapQuoteRequestBody = {
    sender: sender,
    inputToken,
    outputToken,
    amount: swapAmount.toString(),
  };

  console.log('requestBody');
  console.log(requestBody);

  const quote = await client.getSwapQuote.mutate(requestBody);

  const signedCrossChainSwapSteps: SignedCrossChainSwapStep[] = [];

  for (const step of quote.swapSteps) {
    const signedTx = await signEIP1159Tx({
      tx: step.tx,
      account,
    });

    signedCrossChainSwapSteps.push({
      ...step,
      signature: signedTx,
    });
  }

  const submitSwapRequestBody: SubmitSwapRequestBody = {
    sender,
    signedSwapSteps: signedCrossChainSwapSteps,
    amountIn: quote.amountIn,
    amountOut: quote.amountOut,
    amountInUsd: quote.amountInUsd,
    amountOutUsd: quote.amountOutUsd,
    tokenIn: inputToken,
    tokenOut: outputToken,
    relayerServiceFeeAmount: quote.relayerServiceFeeAmount,
    relayerServiceFeeUsd: quote.relayerServiceFeeUsd,
  };

  const submitSwapResponse = await client.submitSwap.mutate(
    submitSwapRequestBody
  );

  console.log('submitSwapResponse');
  console.log(JSON.stringify(submitSwapResponse, null, 2));
};

swap();
