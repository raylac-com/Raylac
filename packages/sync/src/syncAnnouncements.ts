import {
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564_SCHEME_ID,
  getSenderAddressV2,
  decodeERC5564MetadataAsViewTag,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { announcementAbiItem, loop } from './utils';
import processLogs from './processLogs';
import { decodeEventLog, Hex, Log, parseAbi } from 'viem';
import { ERC5564Announcement, Prisma, SyncJob } from '@raylac/db';
import { supportedTokens } from '@raylac/shared';
import { getChainName } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';

/**
 * Create sync tasks for an announcement on a given chain
 *
 * @param announcement - The announcement to create sync tasks for
 * @param chainId - The chain to create sync tasks for
 */
const createSyncTaskForChain = async ({
  announcement,
  chainId,
  scanFromBlock,
}: {
  announcement: ERC5564Announcement;
  chainId: number;
  scanFromBlock: bigint;
}) => {
  const tokenIds = supportedTokens.map(token => token.tokenId);

  const syncTasks: Prisma.SyncTaskCreateManyInput[] = [];
  for (const tokenId of tokenIds) {
    syncTasks.push({
      address: announcement.address as Hex,
      chainId,
      blockNumber: scanFromBlock,
      tokenId,
      eRC5564AnnouncementId: announcement.id,
      blockHash: '0x',
    });
  }

  syncTasks.push({
    address: announcement.address as Hex,
    chainId,
    blockNumber: scanFromBlock,
    tokenId: 'userOps',
    eRC5564AnnouncementId: announcement.id,
    blockHash: '0x',
  });

  await prisma.syncTask.createMany({
    data: syncTasks,
    skipDuplicates: true,
  });

  logger.debug(
    `Created sync tasks for announcement of address ${announcement.address} on ${getChainName(chainId)}`
  );
};

const createSyncTasks = async ({
  announcement,
}: {
  announcement: ERC5564Announcement;
}) => {
  const promises = [];

  const decodedAnnouncementMetadata = decodeERC5564MetadataAsViewTag(
    announcement.metadata as Hex
  );
  const chainInfos = decodedAnnouncementMetadata.chainInfos;

  for (const chainInfo of chainInfos) {
    promises.push(
      createSyncTaskForChain({
        announcement,
        chainId: chainInfo.chainId,
        scanFromBlock: chainInfo.scanFromBlock,
      })
    );
  }

  await Promise.all(promises);
};

export const handleERC5564AnnouncementLog = async ({
  log,
  announcementChainId,
}: {
  log: Log<bigint, number, false>;
  announcementChainId: number;
}) => {
  const decodedLog = decodeEventLog({
    abi: parseAbi([
      'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes ephemeralPubKey, bytes metadata)',
    ]),
    data: log.data,
    topics: log.topics,
  });

  const schemeId = Number(decodedLog.args.schemeId);
  const address = getSenderAddressV2({
    stealthSigner: decodedLog.args.stealthAddress,
  });

  const data: Prisma.ERC5564AnnouncementCreateInput = {
    address,
    schemeId,
    stealthAddress: decodedLog.args.stealthAddress,
    caller: decodedLog.args.caller,
    ephemeralPubKey: decodedLog.args.ephemeralPubKey,
    metadata: decodedLog.args.metadata,
    chainId: announcementChainId,
    blockNumber: log.blockNumber,
    logIndex: log.logIndex,
    txIndex: log.transactionIndex,
  };

  const announcement = await prisma.eRC5564Announcement.upsert({
    create: data,
    update: data,
    where: {
      blockNumber_logIndex_txIndex_chainId: {
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        txIndex: log.transactionIndex,
        chainId: announcementChainId,
      },
    },
  });

  await createSyncTasks({ announcement });
};

/**
 * Sync ERC5564 announcements made on a given chain
 *
 * @param chainIds - The chains to sync announcements for
 */
const syncAnnouncements = async ({
  announcementChainId,
}: {
  announcementChainId: number;
}) => {
  await loop({
    fn: async () => {
      await processLogs({
        chainId: announcementChainId,
        job: SyncJob.Announcements,
        address: ERC5564_ANNOUNCER_ADDRESS,
        event: announcementAbiItem,
        handleLogs: async logs => {
          await Promise.all(
            logs.map(
              async log =>
                await handleERC5564AnnouncementLog({
                  log,
                  announcementChainId,
                })
            )
          );
        },
        args: {
          schemeId: ERC5564_SCHEME_ID,
        },
      });
    },
    interval: 1 * 1000,
  });
};

export default syncAnnouncements;
