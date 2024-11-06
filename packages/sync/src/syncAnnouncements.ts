import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  bigIntMax,
  ERC5564_ANNOUNCER_ADDRESS,
  formatERC5564AnnouncementLog,
  sleep,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { base } from 'viem/chains';
import {
  announcementAbiItem,
  CHAIN_BLOCK_TIME,
  endTimer,
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
          ACCOUNT_IMPL_DEPLOYED_BLOCK[chain.id],
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

const syncAnnouncements = async () => {
  while (true) {
    const announcementBackfillTimer = startTimer('announcementBackfill');
    await processLogs({
      chainId: base.id,
      job: SyncJob.Announcements,
      address: ERC5564_ANNOUNCER_ADDRESS,
      event: announcementAbiItem,
      handleLogs: async logs => {
        for (const log of logs) {
          await handleERC5564AnnouncementLog({ log, chainId: base.id });
        }
      },
    });

    endTimer(announcementBackfillTimer);
    await sleep(3 * 1000);
  }
};

export default syncAnnouncements;
