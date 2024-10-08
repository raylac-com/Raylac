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

const syncBlocksForChain = async (chainId: number) => {
  const publicClient = getPublicClient({
    chainId,
  });

  while (true) {
    const finalizedBlock = await publicClient.getBlock({
      blockTag: 'finalized',
    });

    const fromBlock = bigIntMin([finalizedBlock.number]);

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
      const chunk = Array.from(
        { length: Number(chunkSize) },
        (_, i) => blockNumber + BigInt(i)
      );

      await Promise.all(
        chunk.map(async blockNumber => {
          if (blockNumber > latestBlock.number) {
            return;
          }

          const block = await publicClient.getBlock({
            blockNumber,
          });

          await saveBlock(block, chainId);
        })
      );
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
