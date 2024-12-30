import {
  getPublicClient,
  getWalletClient,
  SendAggregateTxRequestBody,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';

const sendAggregateTx = async ({
  signedTxs,
  chainId,
}: SendAggregateTxRequestBody) => {
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
    logger.info(`Sent tx ${tx}`);

    logger.info(`Waiting for tx ${tx} to be confirmed`);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: tx,
    });

    if (receipt.status === 'success') {
      logger.info(`Tx ${tx} confirmed`);
    } else {
      logger.error(`Tx ${tx} failed`);
    }
  }
};

export default sendAggregateTx;
