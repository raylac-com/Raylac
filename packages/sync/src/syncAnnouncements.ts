import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  ERC5564_ANNOUNCER_ADDRESS,
  formatERC5564AnnouncementLog,
  getPublicClient,
  sleep,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { base } from 'viem/chains';
import { announcementAbiItem } from './utils';

const chain = base;

const getLatestAnnouncementBlock = async () => {
  const latestAnnouncement = await prisma.eRC5564Announcement.findFirst({
    select: {
      blockNumber: true,
    },
    orderBy: {
      blockNumber: 'desc',
    },
  });

  return latestAnnouncement?.blockNumber;
};

const syncAnnouncements = async () => {
  while (true) {
    const client = getPublicClient({
      chainId: chain.id,
    });

    const accountImplDeployedBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chain.id];

    if (!accountImplDeployedBlock) {
      throw new Error('ACCOUNT_IMPL_DEPLOYED_BLOCK is not set');
    }

    const latestAnnouncementBlock = await getLatestAnnouncementBlock();

    const fromBlock = latestAnnouncementBlock
      ? latestAnnouncementBlock + 1n
      : accountImplDeployedBlock;

    const latestBlock = await client.getBlock({
      blockTag: 'latest',
    });

    const toBlock = latestBlock.number;

    const chunkSize = BigInt(10_000);
    for (
      let blockNumber = fromBlock;
      blockNumber <= toBlock;
      blockNumber += chunkSize
    ) {
      const _fromBlock = blockNumber;
      const _toBlock = blockNumber + chunkSize;

      const logs = await client.getLogs({
        address: ERC5564_ANNOUNCER_ADDRESS,
        event: announcementAbiItem,
        fromBlock: _fromBlock,
        toBlock: _toBlock,
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
    }

    await sleep(60 * 1000);
  }
};

export default syncAnnouncements;
