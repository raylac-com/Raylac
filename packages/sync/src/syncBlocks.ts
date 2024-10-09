import { bigIntMin, getPublicClient, sleep } from '@raylac/shared';
import supportedChains from '@raylac/shared/out/supportedChains';
import prisma from './lib/prisma';
import { Block } from 'viem';

const saveBlock = async (block: Block, chainId: number) => {
  if (!block.hash || !block.number) {
    throw new Error('Cannot save pending block');
  }

  const conflictingBlock = await prisma.block.findFirst({
    where: {
      number: Number(block.number),
      hash: {
        not: block.hash,
      },
    },
  });

  if (conflictingBlock) {
    console.log(`Reorg detected for chain ${chainId} at block ${block.number}`);
    await prisma.$transaction([
      prisma.trace.deleteMany({
        where: {
          Transaction: {
            blockHash: conflictingBlock.hash,
          },
        },
      }),
      prisma.userOperation.deleteMany({
        where: {
          Transaction: {
            blockHash: conflictingBlock.hash,
          },
        },
      }),
      prisma.transaction.deleteMany({
        where: {
          blockHash: conflictingBlock.hash,
        },
      }),
      prisma.block.delete({
        where: {
          hash: conflictingBlock.hash,
        },
      }),
      prisma.block.create({
        data: {
          hash: block.hash,
          number: Number(block.number),
          chainId,
        },
      }),
    ]);
  } else {
    const data = {
      hash: block.hash,
      number: Number(block.number),
      chainId,
    };
    await prisma.block.upsert({
      update: data,
      create: data,
      where: {
        hash: block.hash,
      },
    });
  }
};

/**
 * Save the block number and hash to the database.
 */
const syncBlock = async ({
  blockNumber,
  chainId,
}: {
  blockNumber: bigint;
  chainId: number;
}) => {
  const publicClient = getPublicClient({
    chainId,
  });

  const block = await publicClient.getBlock({
    blockNumber,
  });

  await saveBlock(block, chainId);
};

/**
 * Sync blocks in a range.
 * This function is used to sync blocks in a given range concurrently.
 */
export const syncBlocksInRange = async ({
  fromBlock,
  toBlock,
  chainId,
}: {
  fromBlock: bigint;
  toBlock: bigint;
  chainId: number;
}) => {
  const promises = [];

  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    promises.push(syncBlock({ blockNumber, chainId }));
  }

  await Promise.all(promises);
};

const syncBlocksForChain = async (chainId: number) => {
  const publicClient = getPublicClient({
    chainId,
  });

  while (true) {
    const finalizedBlock = await publicClient.getBlock({
      blockTag: 'finalized',
    });

    const fromBlock = finalizedBlock.number + BigInt(1);

    const latestBlock = await publicClient.getBlock({
      blockTag: 'latest',
    });

    console.log(
      `Fetching ${latestBlock.number - fromBlock} blocks for chain ${chainId} from ${fromBlock.toLocaleString()} to ${latestBlock.number.toLocaleString()}`
    );

    const chunkSize = BigInt(100);
    for (
      let blockNumber = fromBlock;
      blockNumber <= latestBlock.number;
      blockNumber += chunkSize
    ) {
      await syncBlocksInRange({
        fromBlock: blockNumber,
        toBlock: bigIntMin([blockNumber + chunkSize, latestBlock.number]),
        chainId,
      });
    }

    await sleep(10 * 1000);
  }
};

const syncBlocks = async () => {
  // Backfill blocks
  await Promise.all(
    supportedChains.map(async chain => {
      await syncBlocksForChain(chain.id);
    })
  );
};

export default syncBlocks;
