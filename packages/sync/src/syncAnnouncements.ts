import {
  bigIntMax,
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564_SCHEME_ID,
  getSenderAddressV2,
  sleep,
  devChains,
} from '@raylac/shared';
import prisma from './lib/prisma';
import {
  announcementAbiItem,
  CHAIN_BLOCK_TIME,
  endTimer,
  startTimer,
} from './utils';
import processLogs from './processLogs';
import { decodeEventLog, Hex, Log, parseAbi } from 'viem';
import { anvil } from 'viem/chains';
import { ERC5564Announcement, Prisma, SyncJob } from '@raylac/db';
import { supportedTokens } from '@raylac/shared';
import { getChainName } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
const SCAN_PAST_BUFFER = 2 * 60 * 1000; // 2 minutes

/**
 * Create sync tasks for an announcement on a given chain
 *
 * @param announcement - The announcement to create sync tasks for
 * @param chainId - The chain to create sync tasks for
 */
const createSyncTaskForChain = async ({
  announcement,
  chainId,
}: {
  announcement: ERC5564Announcement;
  chainId: number;
}) => {
  // eslint-disable-next-line security/detect-object-injection
  const blockTime = CHAIN_BLOCK_TIME[chainId];
  const scanPastBufferBlocks = Math.floor(SCAN_PAST_BUFFER / blockTime);

  let fromBlock;

  const devChainIds = devChains.map(c => c.id);
  const isDevChain = devChainIds.includes(chainId);

  if (isDevChain) {
    fromBlock =
      announcement.blockNumber !== 0n ? announcement.blockNumber - 1n : 0n;
  } else {
    fromBlock = bigIntMax([
      announcement.blockNumber - BigInt(scanPastBufferBlocks),
      0n,
    ]);
  }

  const tokenIds = supportedTokens.map(token => token.tokenId);

  const syncTasks: Prisma.AddressSyncStatusCreateManyInput[] = [];
  for (const tokenId of tokenIds) {
    syncTasks.push({
      address: announcement.address as Hex,
      chainId,
      blockNumber: fromBlock,
      tokenId,
      eRC5564AnnouncementId: announcement.id,
      blockHash: '0x',
    });
  }

  await prisma.addressSyncStatus.createMany({
    data: syncTasks,
    skipDuplicates: true,
  });

  logger.info(
    `Created sync tasks for announcement of address ${announcement.address} on ${getChainName(chainId)}`
  );
};

const createSyncTasks = async ({
  announcement,
  chainIds,
}: {
  announcement: ERC5564Announcement;
  chainIds: number[];
}) => {
  const promises = [];

  for (const chainId of chainIds) {
    if (announcement.chainId === anvil.id && chainId !== anvil.id) {
      // We don't create sync tasks for production chains when the announcement
      // is on the anvil chain
      continue;
    }

    promises.push(createSyncTaskForChain({ announcement, chainId }));
  }
};

export const handleERC5564AnnouncementLog = async ({
  log,
  announcementChainId,
  chainIds,
}: {
  log: Log<bigint, number, false>;
  announcementChainId: number;
  chainIds: number[];
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

  await createSyncTasks({ announcement, chainIds });
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
 * @param chainIds - The chains to sync announcements for
 */
const syncAnnouncements = async ({
  announcementChainId,
  chainIds,
}: {
  announcementChainId: number;
  chainIds: number[];
}) => {
  await deleteV1Accounts();

  while (true) {
    const announcementBackfillTimer = startTimer('announcementBackfill');
    await processLogs({
      chainId: announcementChainId,
      job: SyncJob.Announcements,
      address: ERC5564_ANNOUNCER_ADDRESS,
      event: announcementAbiItem,
      handleLogs: async logs => {
        for (const log of logs) {
          await handleERC5564AnnouncementLog({
            log,
            announcementChainId,
            chainIds,
          });
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
