import {
  getPublicClient,
  getWalletClient,
  SubmitSingleInputSwapRequestBody,
} from '@raylac/shared';
import { Hex } from 'viem';
import { logger } from '@raylac/shared-backend';

const submitSingleInputSwap = async ({
  signedSwapStep,
  signedApproveStep,
}: SubmitSingleInputSwapRequestBody) => {
  // Submit the swap transactions

  const txHashes: Hex[] = [];

  const walletClient = getWalletClient({
    chainId: signedSwapStep.originChainId,
  });
  const publicClient = getPublicClient({
    chainId: signedSwapStep.originChainId,
  });

  if (signedApproveStep) {
    const approveTxHash = await walletClient.sendRawTransaction({
      serializedTransaction: signedApproveStep.signature,
    });

    logger.info(
      `Approve tx ${approveTxHash} sent on chain ${signedSwapStep.originChainId}`
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: approveTxHash,
    });

    if (receipt.status !== 'success') {
      throw new Error(
        `Approve transaction failed on chain ${signedSwapStep.originChainId}`
      );
    }
  }

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
};

export default submitSingleInputSwap;
