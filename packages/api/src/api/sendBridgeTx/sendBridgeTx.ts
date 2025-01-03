import {
  getPublicClient,
  getWalletClient,
  SendBridgeTxRequestBody,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';

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

  for (const signedTx of signedTxs) {
    const tx = await walletClient.sendRawTransaction({
      serializedTransaction: signedTx,
    });
    logger.info(`Sent tx ${signedTx}`);

    await publicClient.waitForTransactionReceipt({
      hash: tx,
    });
  }
};

export default sendBridgeTx;
