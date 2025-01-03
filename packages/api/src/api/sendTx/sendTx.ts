import { getWalletClient, SendTxRequestBody } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import { savePendingTx } from '../../lib/transaction';

const sendTx = async ({ signedTx, chainId, transfer }: SendTxRequestBody) => {
  const walletClient = getWalletClient({
    chainId,
  });

  const tx = await walletClient.sendRawTransaction({
    serializedTransaction: signedTx,
  });

  logger.info(`Sent tx ${tx}`);

  await savePendingTx({
    chainId,
    txHash: tx,
    from: transfer.from,
    to: transfer.to,
    amount: transfer.amount,
    token: transfer.token,
  });
};

export default sendTx;
