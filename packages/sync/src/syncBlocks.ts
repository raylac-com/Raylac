import { bigIntMin, getPublicClient } from '@raylac/shared';
import prisma from './lib/prisma';
import { Block, Hex } from 'viem';
import { Prisma } from '@prisma/client';
import { getWebsocketClient } from '@raylac/shared/src';
import { logger } from './utils';
import supportedChains from '@raylac/shared/out/supportedChains';

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

  logger.info(`Saved new block ${block.number} on chain ${chainId}`);
};

const handleConflictingBlocks = async ({
  blockHashes,
  newBlock,
  chainId,
  forkDepth = 1,
}: {
  blockHashes: Hex[];
  newBlock: Block;
  chainId: number;
  forkDepth?: number;
}) => {
  // Check if the head can be extended

  const parentExists = await prisma.block.findFirst({
    where: {
      hash: newBlock.parentHash,
      chainId,
    },
  });

  if (!parentExists) {
    const publicClient = getPublicClient({
      chainId,
    });

    const parentBlock = await publicClient.getBlock({
      blockHash: newBlock.parentHash,
    });

    await handleConflictingBlocks({
      blockHashes: [parentBlock.hash!],
      newBlock: parentBlock,
      chainId,
      forkDepth: forkDepth + 1,
    });
  }

  logger.info(
    `Revert block at height ${newBlock.number} on chain ${chainId}. ${blockHashes} -> ${newBlock.hash} (depth: ${forkDepth})`
  );

  const newBlockCreateInput: Prisma.BlockCreateInput = {
    hash: newBlock.hash!,
    number: Number(newBlock.number),
    timestamp: newBlock.timestamp,
    chainId,
  };

  await prisma.block.deleteMany({
    where: {
      hash: { in: blockHashes },
    },
  });
  await prisma.block.upsert({
    update: newBlockCreateInput,
    create: newBlockCreateInput,
    where: {
      hash: newBlock.hash!,
    },
  });

  /*
  await prisma.$transaction([
    prisma.trace.deleteMany({
      where: {
        Transaction: {
          blockHash: { in: blockHashes },
        },
      },
    }),
    prisma.userOperation.deleteMany({
      where: {
        Transaction: {
          blockHash: { in: blockHashes },
        },
      },
    }),
    prisma.transaction.deleteMany({
      where: {
        blockHash: { in: blockHashes },
      },
    }),
    prisma.block.deleteMany({
      where: {
        hash: { in: blockHashes },
      },
    }),
    prisma.block.upsert({
      update: newBlockCreateInput,
      create: newBlockCreateInput,
      where: {
        hash: newBlock.hash!,
      },
    }),
  ]);
  */
};

const processNewBlocks = async ({
  blocks,
  chainId,
}: {
  blocks: Block[];
  chainId: number;
}) => {
  for (const block of blocks) {
    if (!block.number) {
      throw new Error(
        `Block number is undefined for block ${block.hash} on chain ${chainId}`
      );
    }

    const existingBlocks = await prisma.block.findMany({
      where: {
        number: block.number,
        hash: { not: block.hash! },
        chainId,
      },
    });

    if (existingBlocks.length > 0) {
      await handleConflictingBlocks({
        blockHashes: existingBlocks.map(b => b.hash as Hex),
        newBlock: block,
        chainId,
      });
    } else {
      await saveNewBlock({ block, chainId });
    }
  }
};
// Mapping of chainId to a list of new blocks
// const newBlocks = new Map<number, Block[]>();

const handleNewBlock = async (block: Block, chainId: number) => {
  /*
  const blocks = newBlocks.get(chainId) || [];

  blocks.push(block);
  newBlocks.set(chainId, blocks);

  if (blocks.length >= 1) {
    await processNewBlocks({ blocks, chainId });

    newBlocks.set(chainId, []);
  }
    */
  await processNewBlocks({ blocks: [block], chainId });
};

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

export const backFillBlocks = async (chainId: number) => {
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

export const syncBlocksForChain = async (chainId: number) => {
  await backFillBlocks(chainId);

  const websocketClient = getWebsocketClient({
    chainId,
  });

  const unwatch = await websocketClient.watchBlocks({
    emitMissed: true,
    emitOnBegin: true,
    onBlock: async block => {
      await handleNewBlock(block, chainId);
    },
    onError(error) {
      logger.error(error);
    },
  });

  return unwatch;
};

const syncBlocks = async () => {
  const syncBlocksJob = [];

  for (const chain of supportedChains) {
    syncBlocksJob.push(syncBlocksForChain(chain.id));
  }

  await Promise.all(syncBlocksJob);
};

export default syncBlocks;
