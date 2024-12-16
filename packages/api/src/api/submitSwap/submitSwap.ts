import {
  getPublicClient,
  getWalletClient,
  SubmitSwapRequestBody,
} from '@raylac/shared';
import { Hex } from 'viem';
import { logger } from '@raylac/shared-backend';
import prisma from '../../lib/prisma';

const submitSwap = async ({
  sender,
  signedSwapSteps,
  amountIn,
  amountOut,
  amountInUsd,
  amountOutUsd,
  tokenIn,
  tokenOut,
  relayerServiceFeeAmount,
  relayerServiceFeeUsd,
}: SubmitSwapRequestBody) => {
  // Submit the swap transactions

  const swaps: {
    fromChainId: number;
    toChainId: number;
    txHash: Hex;
  }[] = [];

  for (const signedSwapStep of signedSwapSteps) {
    const walletClient = getWalletClient({
      chainId: signedSwapStep.originChainId,
    });
    const publicClient = getPublicClient({
      chainId: signedSwapStep.originChainId,
    });

    const swapTxHash = await walletClient.sendRawTransaction({
      serializedTransaction: signedSwapStep.signature,
    });

    logger.info(
      `Swap tx ${swapTxHash} sent on chain ${signedSwapStep.originChainId}`
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: swapTxHash,
    });

    if (receipt.status !== 'success') {
      throw new Error(
        `Swap transaction failed on chain ${signedSwapStep.originChainId}`
      );
    }

    swaps.push({
      fromChainId: signedSwapStep.originChainId,
      toChainId: signedSwapStep.destinationChainId,
      txHash: swapTxHash,
    });
  }

  const tokenAddressIn = tokenIn.addresses[0].address;
  const tokenAddressOut = tokenOut.addresses[0].address;

  await prisma.swap.create({
    data: {
      lineItems: {
        createMany: {
          data: swaps,
        },
      },
      address: sender,
      tokenAddressIn,
      tokenAddressOut,
      amountIn,
      amountOut,
      amountInUsd,
      amountOutUsd,
      relayerServiceFeeAmount,
      relayerServiceFeeUsd,
    },
  });
};

export default submitSwap;
