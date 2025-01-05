import { getWalletClient, SendTxRequestBody } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';

const sendTx = async ({ signedTx, chainId }: SendTxRequestBody) => {
  const walletClient = getWalletClient({
    chainId,
  });

  const txHash = await walletClient.sendRawTransaction({
    serializedTransaction: signedTx,
  });
  logger.info(`Sent tx ${txHash}`);

  return txHash;
};

export default sendTx;
