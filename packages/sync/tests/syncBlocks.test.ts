import { describe, expect, it } from 'vitest';
import { createTestClient, http } from 'viem';
import { anvil, foundry } from 'viem/chains';
import { getPublicClient } from '@raylac/shared';
import { syncBlocksInRange } from '../src/syncBlocks';
import prisma from '../src/lib/prisma';

export const testClient = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(),
});

const client = getPublicClient({ chainId: anvil.id });

const getSavedBlock = async (blockNumber: bigint) => {
  return await prisma.block.findUnique({
    select: {
      hash: true,
      number: true,
    },
    where: {
      number_chainId: {
        number: blockNumber,
        chainId: anvil.id,
      },
    },
  });
};

const getSavedBlockHash = async (blockHash: string) => {
  return await prisma.block.findUnique({
    select: {
      hash: true,
      number: true,
    },
    where: {
      hash: blockHash,
    },
  });
};

describe('syncBlocks', () => {
  it('should sync blocks', async () => {
    const snapshot = await testClient.snapshot();

    await testClient.mine({ blocks: 1 });

    const finalizedBlock = await client.getBlock({
      blockTag: 'finalized',
    });

    const blockBeforeFork = await client.getBlock({
      blockTag: 'latest',
    });

    const toBlock = await client.getBlock({
      blockTag: 'latest',
    });

    await syncBlocksInRange({
      fromBlock: finalizedBlock.number,
      toBlock: toBlock.number,
      chainId: anvil.id,
    });

    await testClient.revert({ id: snapshot });

    await testClient.mine({ blocks: 1 });

    await syncBlocksInRange({
      fromBlock: finalizedBlock.number,
      toBlock: toBlock.number,
      chainId: anvil.id,
    });

    const latestBlockAfterFork = await client.getBlock({
      blockTag: 'latest',
    });

    // The block after the fork should be saved
    const savedBlock = await getSavedBlock(toBlock.number);
    expect(savedBlock).not.toBeNull();
    expect(savedBlock!.hash).toEqual(latestBlockAfterFork.hash);

    // The block before the fork should be deleted
    expect(await getSavedBlockHash(blockBeforeFork.hash)).toBeNull();
  });
});
