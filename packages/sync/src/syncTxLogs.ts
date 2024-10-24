import { getPublicClient } from '@raylac/shared';
import prisma from './lib/prisma';
import { Hex } from 'viem';
import logger from './lib/logger';
import { sleep } from '@raylac/shared';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const syncTxLogs = async () => {
  while (true) {
    const txs = await prisma.transaction.findMany({
      select: {
        hash: true,
        chainId: true,
      },
      where: {
        OR: [
          {
            logs: undefined,
          },
          {
            input: null,
          },
        ],
      },
    });

    logger.info(`Syncing logs for ${txs.length} transactions`);

    for (const { hash, chainId } of txs) {
      const client = getPublicClient({ chainId });
      const txReceipt = await client.getTransactionReceipt({
        hash: hash as Hex,
      });

      if (txReceipt) {
        await prisma.transaction.update({
          where: {
            hash,
          },
          data: {
            logs: JSON.stringify(txReceipt.logs),
          },
        });
      } else {
        logger.error(`No transaction receipt found for ${hash}`);
      }

      const tx = await client.getTransaction({
        hash: hash as Hex,
      });

      if (tx) {
        await prisma.transaction.update({
          where: {
            hash,
          },
          data: {
            input: tx.input,
          },
        });
      } else {
        logger.error(`No transaction found for ${hash}`);
      }
    }

    await sleep(60 * 1000);
  }
};

export default syncTxLogs;
