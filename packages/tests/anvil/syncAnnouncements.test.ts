import { describe, expect, it } from 'vitest';
import { anvil } from 'viem/chains';
import { createStealthAccountForTestUser, waitFor } from '../lib/utils';
import prisma from '../lib/prisma';
import {
  ERC5564_SCHEME_ID,
  getPublicClient,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import { SyncJob } from '@prisma/client';
import { logger } from '../../shared-backend/out';
import { supportedTokens } from '@raylac/shared/src';

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

    const ANNOUNCEMENT_CHAIN_ID = anvil.id;
    const SYNC_ON_CHAIN_IDS = [anvil.id];

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

    const blockNumber = await publicClient.getBlockNumber();

    await waitForAnnouncementsSync({
      blockNumber: BigInt(blockNumber),
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

    const addressSyncStatuses = await prisma.addressSyncStatus.findMany({
      where: {
        address: {
          in: stealthAddresses,
        },
        chainId: {
          in: SYNC_ON_CHAIN_IDS,
        },
      },
    });

    const numSupportedTokens = supportedTokens.length;

    // Each stealth address should have a sync task for each chain and each supported token
    expect(addressSyncStatuses.length).toBe(
      NUM_STEALTH_ADDRESSES * SYNC_ON_CHAIN_IDS.length * numSupportedTokens
    );
  });
});
