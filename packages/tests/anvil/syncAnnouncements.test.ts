import { describe, expect, it } from 'vitest';
import { anvil } from 'viem/chains';
import { createStealthAccountForTestUser, waitFor } from '../lib/utils';
import prisma from '../lib/prisma';
import { ERC5564_SCHEME_ID, StealthAddressWithEphemeral } from '@raylac/shared';
import { logger } from '../../shared-backend/out';
import { Hex } from 'viem';

const ANNOUNCEMENT_CHAIN_ID = anvil.id;
const SYNC_ON_CHAIN_IDS = [anvil.id];

const waitForAnnouncementsSync = async ({
  addresses,
}: {
  addresses: Hex[];
}) => {
  return waitFor({
    fn: async () => {
      const announcements = await prisma.eRC5564Announcement.findMany({
        where: {
          address: {
            in: addresses,
          },
        },
      });

      return announcements.length === addresses.length;
    },
    timeout: 30 * 1000,
    label: 'syncAnnouncements',
  });
};

const waitForSyncTasks = async ({ addresses }: { addresses: Hex[] }) => {
  return waitFor({
    fn: async () => {
      const syncTasks = await prisma.syncTask.findMany({
        where: { address: { in: addresses } },
      });

      return syncTasks.length > 0;
    },
    timeout: 30 * 1000,
    label: 'waitForSyncTasks',
  });
};

/**
 * Test that the indexer correctly backfills announcements.
 * Steps
 * 1. Create new stealth accounts
 * 2. Check that the announcements of 1. are indexed
 * 3. Check that sync tasks are created
 */
describe('syncAnnouncements', () => {
  it('should backfill announcements', async () => {
    const NUM_STEALTH_ADDRESSES = 3;

    // ###################################
    // 1: Create multiple stealth accounts
    // ###################################

    const stealthAccounts: StealthAddressWithEphemeral[] = [];
    for (let i = 0; i < NUM_STEALTH_ADDRESSES; i++) {
      const account = await createStealthAccountForTestUser({
        syncOnChainIds: SYNC_ON_CHAIN_IDS,
        announcementChainId: ANNOUNCEMENT_CHAIN_ID,
      });
      stealthAccounts.push(account);
    }

    for (const account of stealthAccounts) {
      logger.debug(`Created stealth account ${account.address}`);
    }

    await waitForAnnouncementsSync({
      addresses: stealthAccounts.map(account => account.address),
    });

    // ###################################
    // 2. Check that the announcements were indexed
    // ###################################

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

    // ###################################
    // 3. Check that sync tasks were created
    // ###################################

    await waitForSyncTasks({ addresses: stealthAddresses });

    const syncTasks = await prisma.syncTask.findMany({
      where: {
        address: {
          in: stealthAddresses,
        },
        chainId: {
          in: SYNC_ON_CHAIN_IDS,
        },
      },
    });

    // Each stealth address should have a sync task for each chain and each supported token
    expect(syncTasks.length).toBeGreaterThan(stealthAddresses.length);
  });
});
