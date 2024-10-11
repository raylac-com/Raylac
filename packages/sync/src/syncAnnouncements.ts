import {
  ERC5564_ANNOUNCER_ADDRESS,
  formatERC5564AnnouncementLog,
  getPublicClient,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { base } from 'viem/chains';
import { announcementAbiItem } from './utils';

const chain = base;

const syncAnnouncements = async () => {
  const client = getPublicClient({
    chainId: chain.id,
  });

  const logs = await client.getLogs({
    address: ERC5564_ANNOUNCER_ADDRESS,
    event: announcementAbiItem,
    fromBlock: 'earliest',
  });

  for (const log of logs) {
    const data = formatERC5564AnnouncementLog({
      log,
      chainId: client.chain.id,
    });

    await prisma.eRC5564Announcement.upsert({
      create: data,
      update: data,
      where: {
        blockNumber_logIndex_txIndex_chainId: {
          blockNumber: log.blockNumber,
          logIndex: log.logIndex,
          txIndex: log.transactionIndex,
          chainId: client.chain.id,
        },
      },
    });
  }
};

export default syncAnnouncements;
