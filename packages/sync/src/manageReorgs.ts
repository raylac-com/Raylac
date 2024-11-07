import { bigIntMin, getPublicClient } from '@raylac/shared';
import prisma from './lib/prisma';
import { Block, Hex } from 'viem';
import { Prisma } from '@prisma/client';
import { getWebsocketClient } from '@raylac/shared/src';
import { logger } from './utils';
import { supportedChains } from '@raylac/shared';

const saveNewBlock = async ({
  block,
  chainId,
}: {
  block: Block;
  chainId: number;
}) => {
  const newBlockCreateInput: Prisma.BlockCreateInput = {
    hash: block.hash!,
    number: Number(block.number),
    timestamp: block.timestamp,
    chainId,
  };

  try {
    await prisma.block.upsert({
      update: newBlockCreateInput,
      create: newBlockCreateInput,
      where: {
        hash: block.hash!,
      },
    });
  } catch (error) {
    logger.error(`Error saving block ${block} on chain ${chainId}`);
    logger.error(error);
  }

  logger.debug(
    `Saved new block ${block.number?.toLocaleString()} on chain ${chainId}`
  );
};

const handleConflictingBlocks = async ({
  oldBlockHash,
  newBlock,
  chainId,
}: {
  oldBlockHash: Hex;
  newBlock: Block;
  chainId: number;
}) => {
  const newBlockCreateInput: Prisma.BlockCreateInput = {
    hash: newBlock.hash!,
    number: Number(newBlock.number),
    timestamp: newBlock.timestamp,
    chainId,
  };

  await prisma.$transaction([
    prisma.trace.deleteMany({
      where: {
        Transaction: {
          blockHash: oldBlockHash,
        },
      },
    }),
    prisma.userOperation.deleteMany({
      where: {
        Transaction: {
          blockHash: oldBlockHash,
        },
      },
    }),
    prisma.transaction.deleteMany({
      where: {
        blockHash: oldBlockHash,
      },
    }),
    prisma.block.deleteMany({
      where: {
        hash: oldBlockHash,
      },
    }),
    prisma.block.upsert({
      update: newBlockCreateInput,
      create: newBlockCreateInput,
      where: {
        number_chainId: {
          number: Number(newBlock.number),
          chainId,
        },
      },
    }),
  ]);
};

const processNewBlock = async ({
  block,
  chainId,
}: {
  block: Block;
  chainId: number;
}) => {
  if (!block.number) {
    throw new Error(
      `Block number is undefined for block ${block.hash} on chain ${chainId}`
    );
  }

  const existingBlock = await prisma.block.findFirst({
    select: {
      hash: true,
    },
    where: {
      number: block.number,
      chainId,
    },
  });

  if (existingBlock && existingBlock.hash !== block.hash) {
    await handleConflictingBlocks({
      oldBlockHash: existingBlock.hash as Hex,
      newBlock: block,
      chainId,
    });
  } else {
    await saveNewBlock({ block, chainId });
  }
};
// Mapping of chainId to a list of new blocks
// const newBlocks = new Map<number, Block[]>();

const getBlocks = async ({
  fromBlock,
  toBlock,
  chainId,
}: {
  fromBlock: bigint;
  toBlock: bigint;
  chainId: number;
}) => {
  const publicClient = getPublicClient({
    chainId,
  });

  const promises = [];

  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    const block = publicClient.getBlock({
      blockNumber,
    });

    promises.push(block);
  }

  return Promise.all(promises);
};

const syncBlocksConcurrently = async ({
  fromBlock,
  toBlock,
  chainId,
}: {
  fromBlock: bigint;
  toBlock: bigint;
  chainId: number;
}) => {
  const blocks = await getBlocks({ fromBlock, toBlock, chainId });

  const conflictingBlocks = await prisma.block.findMany({
    where: {
      OR: blocks.map(b => ({
        chainId,
        number: b.number,
        NOT: {
          hash: b.hash,
        },
      })),
    },
    orderBy: {
      number: 'desc',
    },
  });

  if (conflictingBlocks.length === 0) {
    await prisma.block.createMany({
      data: blocks.map(b => ({
        hash: b.hash!,
        number: b.number,
        chainId,
      })),
      skipDuplicates: true,
    });

    return;
  }

  logger.info(
    `Found ${conflictingBlocks.length} conflicting blocks for chain ${chainId}.`
  );

  const blockHashesToDelete = conflictingBlocks.map(b => b.hash as Hex);

  await prisma.$transaction([
    prisma.trace.deleteMany({
      where: {
        Transaction: {
          blockHash: { in: blockHashesToDelete },
        },
      },
    }),
    prisma.userOperation.deleteMany({
      where: {
        Transaction: {
          blockHash: { in: blockHashesToDelete },
        },
      },
    }),
    prisma.transaction.deleteMany({
      where: {
        blockHash: { in: blockHashesToDelete },
      },
    }),
    prisma.block.deleteMany({
      where: {
        hash: { in: blockHashesToDelete },
      },
    }),
    prisma.block.createMany({
      data: blocks.map(b => ({
        hash: b.hash!,
        number: b.number,
        chainId,
      })),
      skipDuplicates: true,
    }),
  ]);
};

/**
 * Backfills blocks for a given chain from the latest finalized block to the latest block
 */
export const backFillFromFinalizedBlock = async (chainId: number) => {
  const publicClient = getPublicClient({
    chainId,
  });

  const finalizedBlock = await publicClient.getBlock({
    blockTag: 'finalized',
  });

  const fromBlock = finalizedBlock.number;

  const latestBlock = await publicClient.getBlock({
    blockTag: 'latest',
  });

  logger.info(
    `Backfilling ${latestBlock.number - fromBlock} blocks for chain ${chainId}`
  );

  // Sync 10 blocks at a time concurrently
  const batchSize = 10n;
  for (
    let batchStartBlock = fromBlock;
    batchStartBlock <= latestBlock.number;
    batchStartBlock += batchSize
  ) {
    await syncBlocksConcurrently({
      fromBlock: batchStartBlock,
      toBlock: bigIntMin([batchStartBlock + batchSize, latestBlock.number]),
      chainId,
    });
  }

  logger.info(`Backfilling blocks for chain ${chainId} complete`);
};

export const manageReorgsForChain = async (chainId: number) => {
  await backFillFromFinalizedBlock(chainId);

  const websocketClient = getWebsocketClient({
    chainId,
  });

  const unwatch = await websocketClient.watchBlocks({
    emitMissed: true,
    emitOnBegin: true,
    onBlock: async block => {
      try {
        await processNewBlock({ block, chainId });
      } catch (error) {
        logger.error('Error handling new block', { error });
      }
    },
    onError(error) {
      logger.error(error);
    },
  });

  return unwatch;
};

const manageReorgs = async () => {
  const manageReorgsJob = [];

  for (const chain of supportedChains) {
    manageReorgsJob.push(manageReorgsForChain(chain.id));
  }

  await Promise.all(manageReorgsJob);
};

export default manageReorgs;
