import { describe, expect, it } from 'vitest';
import sync from '../../sync/src/sync';
import { anvil } from 'viem/chains';
import { createStealthAccountForTestUser, waitFor } from '../lib/utils';
import prisma from '../lib/prisma';
import {
  ERC5564_SCHEME_ID,
  getPublicClient,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import { SyncJob } from '@prisma/client';

const publicClient = getPublicClient({ chainId: anvil.id });

const waitForAnnouncementsSync = async ({
  blockNumber,
}: {
  blockNumber: bigint;
}) => {
  return waitFor({
    fn: async () => {
      const syncStatus = await prisma.syncStatus.findFirst({
        select: {
          lastSyncedBlockNum: true,
        },
        where: {
          job: SyncJob.Announcements,
          chainId: anvil.id,
        },
      });

      if (syncStatus && syncStatus.lastSyncedBlockNum >= blockNumber) {
        return true;
      }

      return false;
    },
    timeout: 10 * 1000,
    label: 'syncAnnouncements',
  });
};

describe('syncAnnouncements', () => {
  it('should backfill announcements', async () => {
    const NUM_STEALTH_ADDRESSES = 10;

    // 1: Create multiple stealth addresses for testing

    const stealthAccounts: StealthAddressWithEphemeral[] = [];
    for (let i = 0; i < NUM_STEALTH_ADDRESSES; i++) {
      const account = await createStealthAccountForTestUser({ useAnvil: true });
      stealthAccounts.push(account);
    }

    const blockNumber = await publicClient.getBlockNumber();

    // 2: Sync the announcements
    sync({
      announcementChainId: anvil.id,
      chainIds: [anvil.id],
    });

    await waitForAnnouncementsSync({
      blockNumber: BigInt(blockNumber),
    });

    // 3. Check that the announcements were indexed

    const announcements = await prisma.eRC5564Announcement.findMany({
      where: {
        address: {
          in: stealthAccounts.map(account => account.address),
        },
      },
    });

    expect(announcements.length).toBe(NUM_STEALTH_ADDRESSES);

    const stealthAddresses = stealthAccounts.map(account => account.address);
    for (const announcement of announcements) {
      expect(stealthAddresses).toContain(announcement.address);
      expect(BigInt(announcement.schemeId)).toEqual(ERC5564_SCHEME_ID);
    }
  });
});
