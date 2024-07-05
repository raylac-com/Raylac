import {
  ERC5564_ANNOUNCER_ADDRESS,
  formatERC5564AnnouncementLog,
} from '@sutori/shared';
import { parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import { publicClient } from './lib/viem';

const announcementAbiItem = parseAbiItem(
  'event Announcement(uint256 indexed, address indexed, address indexed, bytes, bytes)'
);

const syncAnnouncements = async () => {
  const logs = await publicClient.getLogs({
    address: ERC5564_ANNOUNCER_ADDRESS,
    event: announcementAbiItem,
    fromBlock: 'earliest',
  });

  for (const log of logs) {
    const data = formatERC5564AnnouncementLog({
      log,
      chainId: publicClient.chain.id,
    });

    await prisma.eRC5564Announcement.upsert({
      create: data,
      update: data,
      where: {
        blockNumber_logIndex_txIndex_chainId: {
          blockNumber: log.blockNumber,
          logIndex: log.logIndex,
          txIndex: log.transactionIndex,
          chainId: publicClient.chain.id,
        },
      },
    });
  }
};

export default syncAnnouncements;
