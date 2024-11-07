import prisma from '../lib/prisma';
import { beforeAll, describe, expect, test } from 'vitest';
import { anvil } from 'viem/chains';
import { Hex, parseEther, zeroAddress } from 'viem';
import { backFillFromFinalizedBlock, manageReorgsForChain } from '@raylac/sync';
import { getPublicClient, getWalletClient, sleep } from '@raylac/shared';
import { fundAddress, testClient } from '../lib/utils';

const chain = anvil;

const waitForBlockSync = async (blockHash: Hex) => {
  const timeoutAt = Date.now() + 20 * 1000;
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

const publicClient = getPublicClient({ chainId: chain.id });

const deleteBlocks = async () => {
  await prisma.block.deleteMany({ where: { chainId: chain.id } });
};

const TEST_ADDRESS = zeroAddress;

/**
 * Send a transaction from the test account to the test address.
 * This is used to fork a chain by inserting a new transaction.
 */
const sendTransaction = async () => {
  await testClient.impersonateAccount({
    address: TEST_ADDRESS,
  });

  const walletClient = getWalletClient({
    chainId: anvil.id,
  });

  await walletClient.sendTransaction({
    to: TEST_ADDRESS,
    account: TEST_ADDRESS,
  });
};

describe('syncBlocks', () => {
  beforeAll(async () => {
    await fundAddress({
      address: TEST_ADDRESS,
      amount: parseEther('1000'),
    });
  });

  describe('backfill', () => {
    test('should backfill from the finalized block', async () => {
      await deleteBlocks();
      await backFillFromFinalizedBlock(chain.id);

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
      await backFillFromFinalizedBlock(chain.id);

      // Revert to the state before the blocks were backfilled
      await testClient.revert({ id: snapshot });

      // Create a fork
      await testClient.mine({ blocks: 16 });

      // Backfill the forked blocks
      await backFillFromFinalizedBlock(chain.id);

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

  describe('manageReorgsForChain', async () => {
    for (const depth of [5, 10]) {
      test(`should handle ${depth} block${depth > 1 ? 's' : ''} reorg correctly`, async () => {
        await deleteBlocks();
        const unwatch = await manageReorgsForChain(chain.id);

        // Get the block number to start mining from
        const fromBlock = await publicClient.getBlockNumber();

        // Get the block number to mine to
        const toBlock = fromBlock + BigInt(depth);

        const snapshot = await testClient.snapshot();

        // Mine the blocks
        await testClient.mine({ blocks: depth });

        const latestBlock = await publicClient.getBlock({
          blockNumber: toBlock,
        });

        // Wait until the block is synched
        await waitForBlockSync(latestBlock.hash);

        // Revert to the state before the blocked were synched
        await testClient.revert({ id: snapshot });

        // Create a fork
        await sendTransaction();
        await testClient.mine({ blocks: depth });

        const forkHeadBlock = await publicClient.getBlock({
          blockNumber: toBlock,
        });

        // Sanity check
        expect(forkHeadBlock.number).toBe(toBlock);
        expect(forkHeadBlock.hash).not.toBe(latestBlock.hash);

        await waitForBlockSync(forkHeadBlock.hash);

        const block = await prisma.block.findUnique({
          select: {
            hash: true,
            number: true,
          },
          where: {
            number_chainId: { number: Number(toBlock), chainId: chain.id },
          },
        });

        expect(block).toBeDefined();
        expect(block?.hash).toBe(forkHeadBlock.hash);

        unwatch();
      });
    }
  });
});
