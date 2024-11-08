import { describe, expect, it } from 'vitest';
import sync from '../../sync/src/sync';
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
      //      console.log(syncStatus);

      if (
        syncStatus.length === addresses.length &&
        syncStatus.every(status => BigInt(status.blockNumber) >= blockNumber)
      ) {
        return true;
      }

      return false;
    },
    timeout: 60 * 1000,
    label: 'syncNativeTransfers',
  });
};

describe('syncNativeTransfers', () => {
  it('should backfill native transfers', async () => {
    const NUM_STEALTH_ADDRESSES = 5;

    // 1: Create multiple stealth addresses for testing
    const stealthAccounts: StealthAddressWithEphemeral[] = [];
    for (let i = 0; i < NUM_STEALTH_ADDRESSES; i++) {
      const account = await createStealthAccountForTestUser({ useAnvil: true });
      stealthAccounts.push(account);
    }

    const sender = zeroAddress;

    // 2. Fund the sender

    await testClient.setBalance({
      address: sender,
      value: parseEther('100'),
    });

    // 3. Send transactions to the stealth addresses

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

    // 4: Run the indexer
    sync({
      announcementChainId: anvil.id,
      chainIds: [anvil.id],
    });

    const blockNumber = await publicClient.getBlockNumber();
    await waitForSync({
      addresses: stealthAccounts.map(account => account.address),
      blockNumber,
    });

    // 5. Check that the transfers were indexed

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
