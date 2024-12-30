import { getWalletClient, SendAggregateTxRequestBody } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';

const sendAggregateTx = async ({
  signedTxs,
  chainId,
}: SendAggregateTxRequestBody) => {
  const walletClient = getWalletClient({
    chainId,
  });

  for (const signedTx of signedTxs) {
    const tx = await walletClient.sendRawTransaction({
      serializedTransaction: signedTx,
    });

    logger.info(`Sent tx ${tx}`);
  }
};

export default sendAggregateTx;
