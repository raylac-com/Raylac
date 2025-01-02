import { Hex } from 'viem';
import { redisClient } from './redis';
import { PendingTx } from '@raylac/shared';

const getTxKey = ({ from, txHash }: { from: Hex; txHash: Hex }): string => {
  return `${from}-${txHash}`;
};

export const savePendingTx = async (pendingTx: PendingTx) => {
  await redisClient.set(getTxKey(pendingTx), JSON.stringify(pendingTx));
};

export const getPendingTxsFromRedis = async (
  address: Hex
): Promise<PendingTx[]> => {
  const keys = await redisClient.keys(`${address}*`);

  if (keys.length === 0) {
    return [];
  }

  const txs = await redisClient.mGet(keys);
  return txs.filter(tx => tx !== null).map(tx => JSON.parse(tx));
};

export const deletePendingTx = async (
  txs: {
    from: Hex;
    txHash: Hex;
  }[]
) => {
  await Promise.all(txs.map(tx => redisClient.del(getTxKey(tx))));
};
