import {
  getPublicClient,
  getWalletClient,
  SendBridgeTxRequestBody,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import { Hex } from 'viem';

const sendBridgeTx = async ({
  signedTxs,
  chainId,
}: SendBridgeTxRequestBody) => {
  const walletClient = getWalletClient({
    chainId,
  });

  const publicClient = getPublicClient({
    chainId,
  });

  const txHashes: Hex[] = [];
  for (const signedTx of signedTxs) {
    const tx = await walletClient.sendRawTransaction({
      serializedTransaction: signedTx,
    });
    logger.info(`Sent tx ${signedTx}`);

    await publicClient.waitForTransactionReceipt({
      hash: tx,
    });

    txHashes.push(tx);
  }

  return txHashes[0];
};

export default sendBridgeTx;
