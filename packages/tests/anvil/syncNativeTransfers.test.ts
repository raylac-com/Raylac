import { beforeAll, describe, expect, it } from 'vitest';
import { anvil } from 'viem/chains';
import {
  createStealthAccountForTestUser,
  getTestClient,
  waitFor,
} from '../lib/utils';
import prisma from '../lib/prisma';
import {
  getPublicClient,
  getWalletClient,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import { getAddress, Hex, parseEther } from 'viem';
import { zeroAddress } from 'viem';
import { getAuthedClient } from '../lib/rpc';

const testClient = getTestClient();
const walletClient = getWalletClient({ chainId: anvil.id });
const publicClient = getPublicClient({ chainId: anvil.id });

const waitForSync = async ({
  addresses,
  blockNumber,
}: {
  addresses: Hex[];
  blockNumber: bigint;
}) => {
  await waitFor({
    fn: async () => {
      const syncStatus = await prisma.addressSyncStatus.findMany({
        select: {
          address: true,
          chainId: true,
          blockNumber: true,
          blockHash: true,
          tokenId: true,
        },
        where: {
          tokenId: 'eth',
          address: { in: addresses },
          chainId: anvil.id,
        },
      });

      if (
        syncStatus.length === addresses.length &&
        syncStatus.every(status => BigInt(status.blockNumber) >= blockNumber)
      ) {
        return true;
      }

      return false;
    },
    timeout: 60 * 1000,
    interval: 1000,
    label: 'syncNativeTransfers',
  });
};

/**
 * Test that the indexer correctly backfills native transfers.
 * Steps
 * 1. Create new stealth addresses
 * 2. Send ETH to the new stealth addresses
 * 3. Check that the transfers of 2. are indexed
 */
describe('syncNativeTransfers', () => {
  beforeAll(async () => {
    // Delete all the data on the anvil chain from the database we're testing against
    const authedClient = await getAuthedClient();
    await authedClient.pruneAnvil.mutate();
  });

  it('should backfill native transfers', async () => {
    const NUM_STEALTH_ADDRESSES = 2;

    // 1. Create {NUM_STEALTH_ADDRESSES} stealth addresses for testing

    const stealthAccountPromises: Promise<StealthAddressWithEphemeral>[] = [];
    for (let i = 0; i < NUM_STEALTH_ADDRESSES; i++) {
      const account = createStealthAccountForTestUser({
        useAnvil: true,
      });
      stealthAccountPromises.push(account);
    }
    const stealthAccounts = await Promise.all(stealthAccountPromises);

    const sender = zeroAddress;
    await testClient.setBalance({
      address: sender,
      value: parseEther('100'),
    });

    // 2. Send ETH to the stealth addresses created in 1.

    await testClient.impersonateAccount({
      address: sender,
    });

    const SEND_AMOUNT = parseEther('0.1');

    const txHashes: Hex[] = [];

    for (const account of stealthAccounts) {
      const txHash = await walletClient.sendTransaction({
        account: sender,
        to: account.address,
        value: SEND_AMOUNT,
      });
      txHashes.push(txHash);
    }

    await testClient.stopImpersonatingAccount({
      address: sender,
    });

    const blockNumber = await publicClient.getBlockNumber();

    // Wait for the transfers to be indexed
    await waitForSync({
      addresses: stealthAccounts.map(account => account.address),
      blockNumber,
    });

    // 3. Check that the transfers were indexed

    const txs = await Promise.all(
      txHashes.map(hash => publicClient.getTransaction({ hash }))
    );

    const traces = await prisma.trace.findMany({
      select: {
        transactionHash: true,
        from: true,
        to: true,
        amount: true,
        chainId: true,
        Transaction: {
          select: {
            block: {
              select: {
                number: true,
                hash: true,
                timestamp: true,
              },
            },
          },
        },
      },
      where: {
        transactionHash: {
          in: txs.map(tx => tx.hash),
        },
      },
    });

    expect(traces.length).toBe(NUM_STEALTH_ADDRESSES);
    for (const trace of traces) {
      const tx = txs.find(tx => tx.hash === trace.transactionHash);

      expect(tx).toBeDefined();
      expect(trace.chainId).toBe(anvil.id);
      expect(trace.from).toBe(sender);
      expect(trace.to).toBe(getAddress(tx!.to!));
      expect(BigInt(trace.amount.toNumber())).toBe(SEND_AMOUNT);
      expect(trace.Transaction.block.number).toBe(tx!.blockNumber);
      expect(trace.Transaction.block.hash).toBe(tx!.blockHash);
      expect(trace.Transaction.block.timestamp).toBeDefined();
    }
  });
});
