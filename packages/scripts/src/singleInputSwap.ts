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
  GetSingleInputSwapQuoteRequestBody,
  getWalletClient,
  signEIP1159Tx,
  SubmitSingleInputSwapRequestBody,
  USDC,
  WST_ETH,
} from '@raylac/shared';

const swap = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );
  const sender = account.address;

  const swapAmount = parseUnits('1', 6);

  const requestBody: GetSingleInputSwapQuoteRequestBody = {
    sender: sender,
    inputToken: USDC,
    outputToken: USDC,
    amount: swapAmount.toString(),
    inputChainId: base.id,
    outputChainId: arbitrum.id,
  };

  const quote = await client.getSingleInputSwapQuote.mutate(requestBody);

  console.log('quote');
  console.log(JSON.stringify(quote, null, 2));

  const signedApproveTx = quote.approveStep
    ? await signEIP1159Tx({
        tx: quote.approveStep.tx,
        account,
      })
    : null;

  const signedSwapTx = await signEIP1159Tx({
    tx: quote.swapStep.tx,
    account,
  });

  const submitRequestBody: SubmitSingleInputSwapRequestBody = {
    signedApproveStep:
      quote.approveStep && signedApproveTx
        ? { ...quote.approveStep, signature: signedApproveTx }
        : null,
    signedSwapStep: {
      ...quote.swapStep,
      signature: signedSwapTx,
    },
  };

  const tx = await client.submitSingleInputSwap.mutate(submitRequestBody);
};

swap();