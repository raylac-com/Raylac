import prisma from '../lib/prisma';
import { describe, expect, test } from 'vitest';
import { anvil } from 'viem/chains';
import { createTestClient, Hex, http } from 'viem';
import { backFillBlocks, syncBlocksForChain } from '@raylac/sync';
import { getPublicClient, sleep } from '@raylac/shared';

const chain = anvil;

const waitForBlockSync = async (blockHash: Hex) => {
  const timeoutAt = Date.now() + 10 * 1000;
  while (true) {
    const block = await prisma.block.findFirst({
      where: { hash: blockHash, chainId: chain.id },
    });

    if (block) {
      return;
    }

    await sleep(1000);

    if (Date.now() > timeoutAt) {
      throw new Error(`Block ${blockHash} not synced within 10 seconds`);
    }
  }
};

const testClient = createTestClient({
  mode: 'anvil',
  chain,
  transport: http('http://127.0.0.1:8545'),
});

const publicClient = getPublicClient({ chainId: chain.id });

const deleteBlocks = async () => {
  await prisma.block.deleteMany({ where: { chainId: chain.id } });
};

describe('syncBlocks', () => {
  describe('backfill', () => {
    test('should backfill from the finalized block', async () => {
      await deleteBlocks();
      await backFillBlocks(chain.id);

      const oldestSyncedBlock = await prisma.block.findFirst({
        where: { chainId: chain.id },
        orderBy: { number: 'asc' },
      });

      const finalizedBlock = await publicClient.getBlock({
        blockTag: 'finalized',
      });

      expect(oldestSyncedBlock).toBeDefined();
      expect(oldestSyncedBlock?.number).toBe(finalizedBlock.number);
      expect(oldestSyncedBlock?.hash).toBe(finalizedBlock.hash);
    });

    test('should handle forked blocks when backfilling', async () => {
      await deleteBlocks();
      const snapshot = await testClient.snapshot();

      await testClient.mine({ blocks: 16 });

      // Should backfill the blocks mined in the above line
      await backFillBlocks(chain.id);

      // Revert to the state before the blocks were backfilled
      await testClient.revert({ id: snapshot });

      // Create a fork
      await testClient.mine({ blocks: 16 });

      // Backfill the forked blocks
      await backFillBlocks(chain.id);

      const oldestSyncedBlock = await prisma.block.findFirst({
        where: { chainId: chain.id },
        orderBy: { number: 'asc' },
      });

      const finalizedBlock = await publicClient.getBlock({
        blockTag: 'finalized',
      });

      expect(oldestSyncedBlock).toBeDefined();
      expect(oldestSyncedBlock?.number).toBe(finalizedBlock.number);
      expect(oldestSyncedBlock?.hash).toBe(finalizedBlock.hash);
    });
  });

  describe.only('syncBlocksForChain', async () => {
    for (const depth of [5, 10]) {
      test(`should handle ${depth} block${depth > 1 ? 's' : ''} reorg correctly`, async () => {
        await deleteBlocks();
        const unwatch = await syncBlocksForChain(chain.id);

        const snapshot = await testClient.snapshot();
        await testClient.mine({ blocks: depth });

        const latestBlock = await publicClient.getBlock({
          blockTag: 'latest',
        });

        // Wait until the block is synched
        await waitForBlockSync(latestBlock.hash);

        // Revert to the state before the blocked were synched
        await testClient.revert({ id: snapshot });

        // Create a fork
        await testClient.mine({ blocks: depth });

        const forkHeadBlock = await publicClient.getBlock({
          blockTag: 'latest',
        });

        await waitForBlockSync(forkHeadBlock.hash);

        const block = await prisma.block.findUnique({
          select: {
            hash: true,
            number: true,
          },
          where: { hash: forkHeadBlock.hash, chainId: chain.id },
        });

        expect(block).toBeDefined();
        expect(block?.number).toBe(forkHeadBlock.number);
        expect(block?.hash).toBe(forkHeadBlock.hash);

        unwatch();
      });
    }
  });
});
