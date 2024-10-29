import {
  ERC5564_ANNOUNCER_ADDRESS,
  formatERC5564AnnouncementLog,
  sleep,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { base } from 'viem/chains';
import { announcementAbiItem, logger } from './utils';
import processLogs from './processLogs';
import { Log } from 'viem';
import { SyncJob } from '@prisma/client';

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

  await prisma.eRC5564Announcement.upsert({
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

    await sleep(60 * 1000);
  }
};

export default syncAnnouncements;
