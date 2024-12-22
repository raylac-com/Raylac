import {
  getPublicClient,
  getWalletClient,
  SubmitSingleChainSwapRequestBody,
} from '@raylac/shared';
import { Hex } from 'viem';
import { logger } from '@raylac/shared-backend';

const submitSingleChainSwap = async ({
  signedSwapSteps,
}: SubmitSingleChainSwapRequestBody) => {
  // Submit the swap transactions

  const txHashes: Hex[] = [];

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

    txHashes.push(swapTxHash);
  }
};

export default submitSingleChainSwap;
