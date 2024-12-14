import {
  getPublicClient,
  GetSwapQuoteReturnType,
  getWalletClient,
} from '@raylac/shared';
import { Hex } from 'viem';
import { bundlerAccount } from '../../lib/bundler';
import { logger } from '@raylac/shared-backend';

const submitSwap = async ({
  swapQuote,
  signedTxs,
}: {
  swapQuote: GetSwapQuoteReturnType;
  signedTxs: {
    chainId: number;
    signedTx: Hex;
    sender: Hex;
  }[];
}) => {
  const chains = new Set(
    swapQuote.steps.flatMap(step =>
      step.items.flatMap(item => item.data.chainId)
    )
  );

  // Fund the sender account on all chains

  for (const chainId of chains) {
    const stepItemsOnChain = swapQuote.steps.flatMap(step =>
      step.items.filter(item => item.data.chainId === chainId)
    );

    const totalGas = stepItemsOnChain.reduce(
      (acc, item) =>
        acc + BigInt(item.data.gas || 500_000) * BigInt(item.data.maxFeePerGas),
      0n
    );

    const walletClient = getWalletClient({ chainId });
    const publicClient = getPublicClient({ chainId });

    logger.info(
      `Funding ${totalGas} gas on chain ${chainId} to ${signedTxs[0].sender}`
    );

    const fundingTx = await walletClient.sendTransaction({
      account: bundlerAccount,
      to: signedTxs[0].sender,
      value: totalGas * BigInt(2),
    });

    logger.info(`Funding transaction ${fundingTx} sent on chain ${chainId}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: fundingTx,
    });

    if (receipt.status !== 'success') {
      throw new Error(`Funding transaction failed on chain ${chainId}`);
    }
  }

  // Submit the swap transactions

  for (const tx of signedTxs) {
    const walletClient = getWalletClient({ chainId: tx.chainId });
    const publicClient = getPublicClient({ chainId: tx.chainId });
    const swapTxHash = await walletClient.sendRawTransaction({
      serializedTransaction: tx.signedTx,
    });

    logger.info(`Swap tx ${swapTxHash} sent on chain ${tx.chainId}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: swapTxHash,
    });

    if (receipt.status !== 'success') {
      throw new Error(`Swap transaction failed on chain ${tx.chainId}`);
    }
  }
};

export default submitSwap;
