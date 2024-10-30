import {
  ERC5564_ANNOUNCER_ADDRESS,
  formatERC5564AnnouncementLog,
  sleep,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { arbitrum, base, optimism, scroll } from 'viem/chains';
import { announcementAbiItem, logger } from './utils';
import processLogs from './processLogs';
import { Log } from 'viem';
import { Prisma, SyncJob } from '@prisma/client';
import supportedChains from '@raylac/shared/out/supportedChains';
import supportedTokens from '@raylac/shared/out/supportedTokens';

const CHAIN_BLOCK_TIME: Record<number, number> = {
  [base.id]: 2000,
  [arbitrum.id]: 250,
  [optimism.id]: 2000,
  [scroll.id]: 2000,
};

const SCAN_PAST_BUFFER = 30 * 60 * 1000; // 30 minutes

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
  const addressSyncStatuses = supportedChains.flatMap(chain => {
    const blockTime = CHAIN_BLOCK_TIME[chain.id];
    const scanPastBufferBlocks = Math.floor(SCAN_PAST_BUFFER / blockTime);

    const fromBlock = log.blockNumber - BigInt(scanPastBufferBlocks);

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
  });

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
    try {
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
    } catch (error) {
      logger.error('Error syncing announcements', { error });
    }

    await sleep(3 * 1000);
  }
};

export default syncAnnouncements;
