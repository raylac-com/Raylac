import { getWalletClient, SendAggregateTxRequestBody } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import { savePendingTx } from '../../lib/transaction';

const sendAggregateTx = async ({
  signedTxs,
  chainId,
  transfer,
}: SendAggregateTxRequestBody) => {
  const walletClient = getWalletClient({
    chainId,
  });

  for (const signedTx of signedTxs) {
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
  }
};

export default sendAggregateTx;
