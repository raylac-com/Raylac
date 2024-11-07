import {
  bigIntMax,
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564_SCHEME_ID,
  formatERC5564AnnouncementLog,
  sleep,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { base } from 'viem/chains';
import {
  announcementAbiItem,
  CHAIN_BLOCK_TIME,
  endTimer,
  getRaylacDeployedBlock,
  logger,
  startTimer,
} from './utils';
import processLogs from './processLogs';
import { Log } from 'viem';
import { Prisma, SyncJob } from '@prisma/client';
import { supportedChains } from '@raylac/shared';
import { supportedTokens } from '@raylac/shared';

const SCAN_PAST_BUFFER = 2 * 60 * 1000; // 2 minutes

export const handleERC5564AnnouncementLog = async ({
  log,
  chainId,
}: {
  log: Log<bigint, number, false>;
  chainId: number;
}) => {
  const data = formatERC5564AnnouncementLog({
    log,
    chainId,
  });

  if (data.address === '0x5a27067D67C9B016E49feA767D35E7121D794D57') {
    return;
  }

  // Create address sync statuses records for the announcement address for all chains
  // The worker in `syncNativeTransfers.ts` will scan blocks for the announced address
  // from the specified block height.
  const addressSyncStatuses = (
    await Promise.all(
      supportedChains.map(async chain => {
        if (chain.id !== base.id) {
          throw new Error(`Unsupported chain ${chain.id}`);
        }

        const blockTime = CHAIN_BLOCK_TIME[chain.id];
        const scanPastBufferBlocks = Math.floor(SCAN_PAST_BUFFER / blockTime);

        const fromBlock = bigIntMax([
          log.blockNumber - BigInt(scanPastBufferBlocks),
          getRaylacDeployedBlock({ chainId: chain.id }),
        ]);

        return supportedTokens.map(token => {
          const item: Omit<
            Prisma.AddressSyncStatusCreateManyInput,
            // We omit eRC5564AnnouncementId because it's set after the eRC5564Announcement is inserted to the db
            'eRC5564AnnouncementId'
          > = {
            address: data.address,
            chainId: chain.id,
            blockNumber: fromBlock,
            tokenId: token.tokenId,
            blockHash: log.blockHash,
          };

          return item;
        });
      })
    )
  ).flat();

  await prisma.$transaction(async prisma => {
    const announcement = await prisma.eRC5564Announcement.upsert({
      create: data,
      update: data,
      where: {
        blockNumber_logIndex_txIndex_chainId: {
          blockNumber: log.blockNumber,
          logIndex: log.logIndex,
          txIndex: log.transactionIndex,
          chainId,
        },
      },
    });

    await prisma.addressSyncStatus.createMany({
      data: addressSyncStatuses.map(addressSyncStatus => ({
        ...addressSyncStatus,
        eRC5564AnnouncementId: announcement.id,
      })),
      skipDuplicates: true,
    });
  });
};

/**
 * Delete all v1 accounts and related records from the database
 */
const deleteV1Accounts = async () => {
  const v1Announcements = await prisma.eRC5564Announcement.findMany({
    select: {
      address: true,
    },
    where: {
      schemeId: 1,
    },
  });

  const v1Addresses = v1Announcements
    .map(a => a.address)
    .filter(a => a !== null);

  await prisma.addressSyncStatus.deleteMany({
    where: {
      address: { in: v1Addresses },
    },
  });

  await prisma.userStealthAddress.deleteMany({
    where: {
      address: { in: v1Addresses },
    },
  });

  await prisma.userOperation.deleteMany({
    where: {
      sender: { in: v1Addresses },
    },
  });

  logger.info(`Deleted ${v1Addresses.length} v1 accounts`);
};

/**
 * Sync ERC5564 announcements made on a given chain
 *
 * @param chainId - The chain to sync announcements for
 */
const syncAnnouncements = async ({ chainId }: { chainId: number }) => {
  await deleteV1Accounts();

  while (true) {
    const announcementBackfillTimer = startTimer('announcementBackfill');
    await processLogs({
      chainId,
      job: SyncJob.Announcements,
      address: ERC5564_ANNOUNCER_ADDRESS,
      event: announcementAbiItem,
      handleLogs: async logs => {
        for (const log of logs) {
          await handleERC5564AnnouncementLog({ log, chainId });
        }
      },
      args: {
        schemeId: ERC5564_SCHEME_ID,
      },
    });

    endTimer(announcementBackfillTimer);
    await sleep(3 * 1000);
  }
};

export default syncAnnouncements;
