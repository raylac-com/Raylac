import {
  GetSwapQuoteRequestBody,
  ETH,
  WST_ETH,
  signEIP1159Tx,
  SignedCrossChainSwapStep,
  SubmitSwapRequestBody,
} from '@raylac/shared';
import { client } from './rpc';
import { formatEther, Hex, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum, base } from 'viem/chains';

const getStakedBalance = async () => {
  const account = privateKeyToAccount(
    process.env.TEST_RELAY_PRIVATE_KEY as Hex
  );
  const sender = account.address;

  const stakedBalance = await client.getStakedBalance.query({
    address: sender,
  });

  const ethBalance = await client.getETHBalance.query({
    address: sender,
  });

  for (const balance of ethBalance) {
    console.log(balance.chain, formatEther(BigInt(balance.balance)));
  }

  const quoteRequestBody: GetSwapQuoteRequestBody = {
    sender,
    inputToken: ETH,
    outputToken: WST_ETH,
    amount: parseEther('0.0002').toString(),
    chainId: arbitrum.id,
  };

  const quote = await client.getSwapQuote.mutate(quoteRequestBody);

  console.log(quote);

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
    tokenIn: ETH,
    tokenOut: WST_ETH,
    relayerServiceFeeAmount: quote.relayerServiceFeeAmount,
    relayerServiceFeeUsd: quote.relayerServiceFeeUsd,
  };

  const submitSwap = await client.submitSwap.mutate(submitSwapRequestBody);
};

getStakedBalance();
