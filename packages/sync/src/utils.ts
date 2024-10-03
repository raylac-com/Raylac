import { SyncJob } from '@prisma/client';
import prisma from './lib/prisma';

export const updateJobLatestSyncedBlock = async ({
  chainId,
  syncJob,
  blockNumber,
}: {
  chainId: number;
  syncJob: SyncJob;
  blockNumber: bigint;
}) => {
  const data = {
    lastSyncedBlockNum: blockNumber,
    chainId,
    job: syncJob,
  };

  await prisma.syncStatus.upsert({
    update: data,
    create: data,
    where: {
      chainId_job: {
        chainId,
        job: syncJob,
      },
    },
  });
};

/*
export const getReorgedTxs = async (
  expectedBlockHashes: {
    blockNumber: bigint;
    blockHash: Hex;
    chainId: number;
  }[]
) => {
  const txs = await prisma.transaction.findMany({
    select: {
      hash: true,
      blockNumber: true,
      blockHash: true,
    },
    where: {
      blockNumber: {
        in: expectedBlockHashes.map(tx => tx.blockNumber),
      },
    },
  });

  return txs.filter(tx => {
    const expectedBlockHash = expectedBlockHashes.find(
      e => e.blockNumber === tx.blockNumber
    )?.blockHash;

    if (!expectedBlockHash) {
      throw new Error(
        `Expected block hash not found for block number ${tx.blockNumber}`
      );
    }

    return tx.blockHash !== expectedBlockHash;
  });
};

export const buildReorgedTxsWhereClause = (
  txs: {
    blockNumber: bigint;
    blockHash: Hex;
    chainId: number;
  }[]
) => {
  const blocks = txs.map(tx => ({
    AND: {
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      chainId: tx.chainId,
    },
  }));

  return {
    NOT: {
      OR: blocks,
    },
  };
};
*/

export const getLatestBlockHeight = async (chainId: number) => {
  const block = await prisma.block.findFirst({
    where: {
      chainId,
    },
    orderBy: {
      number: 'desc',
    },
  });

  if (!block) {
    throw new Error(`No block found for chain ${chainId}`);
  }

  return block.number;
};
