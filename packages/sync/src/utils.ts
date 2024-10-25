import { Prisma, SyncJob } from '@prisma/client';
import prisma from './lib/prisma';
import { Hex, parseAbiItem, ParseEventLogsReturnType } from 'viem';
import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  bigIntMin,
  ERC20Abi,
  getPublicClient,
  initLogger,
} from '@raylac/shared';

export const announcementAbiItem = parseAbiItem(
  'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes viewTag, bytes ephemeralPubKey)'
);

export const getFromBlock = async ({
  chainId,
  job,
}: {
  chainId: number;
  job: SyncJob;
}) => {
  // eslint-disable-next-line security/detect-object-injection
  const raylacAccountDeployedBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

  if (!raylacAccountDeployedBlock) {
    throw new Error(
      `ACCOUNT_IMPL_DEPLOYED_BLOCK not found for chain ${chainId}`
    );
  }

  const jobStatus = await prisma.syncStatus.findFirst({
    select: {
      lastSyncedBlockNum: true,
    },
    where: {
      job,
      chainId,
    },
  });

  const latestSynchedBlock =
    jobStatus?.lastSyncedBlockNum ?? raylacAccountDeployedBlock;

  const client = getPublicClient({ chainId });

  const finalizedBlockNumber = await client.getBlock({
    blockTag: 'finalized',
  });

  if (finalizedBlockNumber.number === null) {
    throw new Error('Finalized block number is null');
  }

  const fromBlock = bigIntMin([
    latestSynchedBlock,
    finalizedBlockNumber.number,
  ]);

  return fromBlock;
};

/**
 * Get the latest synced block number for a sync job
 */
export const getLatestSynchedBlockForJob = async (
  chainId: number,
  job: SyncJob
): Promise<bigint | null> => {
  const syncJobStatus = await prisma.syncStatus.findFirst({
    select: {
      lastSyncedBlockNum: true,
    },
    where: {
      job,
      chainId,
    },
  });

  return syncJobStatus?.lastSyncedBlockNum ?? null;
};

/**
 * Save the latest synced block number for a sync job to the database.
 */
export const updateJobLatestSyncedBlock = async ({
  chainId,
  syncJob,
  blockNumber,
}: {
  chainId: number;
  syncJob: SyncJob;
  blockNumber: bigint;
}) => {
  const data = {
    lastSyncedBlockNum: blockNumber,
    chainId,
    job: syncJob,
  };

  await prisma.syncStatus.upsert({
    update: data,
    create: data,
    where: {
      chainId_job: {
        chainId,
        job: syncJob,
      },
    },
  });
};

export const getLatestBlockHeight = async (chainId: number) => {
  const block = await prisma.block.findFirst({
    where: {
      chainId,
    },
    orderBy: {
      number: 'desc',
    },
  });

  return block?.number;
};

export type ERC20TransferLogType = ParseEventLogsReturnType<
  typeof ERC20Abi,
  'Transfer',
  true
>[number];

export const getMinSynchedBlockForAddresses = async ({
  addresses,
  tokenId,
  chainId,
}: {
  addresses: Hex[];
  tokenId: string;
  chainId: number;
}) => {
  const addressSyncStatus = await prisma.addressSyncStatus.findMany({
    select: {
      address: true,
      lastSyncedBlockNum: true,
    },
    where: {
      address: {
        in: addresses,
      },
      chainId,
      tokenId,
    },
  });

  // eslint-disable-next-line security/detect-object-injection
  const defaultFromBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

  if (!defaultFromBlock) {
    throw new Error(`No default from block for chain ${chainId}`);
  }

  const minSynchedBlock = addresses
    .map(
      address =>
        addressSyncStatus.find(status => status.address === address)
          ?.lastSyncedBlockNum || defaultFromBlock
    )
    .sort((a, b) => (a > b ? 1 : -1))[0];

  return minSynchedBlock;
};

export const updateAddressesSyncStatus = async ({
  addresses,
  chainId,
  tokenId,
  blockNum,
}: {
  addresses: Hex[];
  chainId: number;
  tokenId: string;
  blockNum: bigint;
}) => {
  const currentSyncStatus = await prisma.addressSyncStatus.findMany({
    where: {
      address: {
        in: addresses,
      },
      chainId,
      tokenId,
    },
  });

  // Get addresses that don't have a sync status record
  const addressesWithoutSyncStatus = addresses.filter(
    address => !currentSyncStatus.find(status => status.address === address)
  );

  // Get addresses that have a sync status record
  const addressesWithSyncStatus = addresses.filter(address =>
    currentSyncStatus.find(status => status.address === address)
  );

  // Create sync status records for addresses that don't have one
  await prisma.addressSyncStatus.createMany({
    data: addressesWithoutSyncStatus.map(address => ({
      address,
      chainId,
      tokenId,
      lastSyncedBlockNum: blockNum,
    })),
    skipDuplicates: true,
  });

  // Update sync status records for addresses that have one
  await prisma.addressSyncStatus.updateMany({
    data: {
      lastSyncedBlockNum: blockNum,
    },
    where: {
      address: {
        in: addressesWithSyncStatus,
      },
      chainId,
      tokenId,
    },
  });
};

export const upsertTransaction = async ({
  txHash,
  chainId,
}: {
  txHash: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });

  const txExists = await prisma.transaction.findUnique({
    where: {
      hash: txHash,
    },
  });

  if (txExists) {
    return;
  }

  const tx = await client.getTransactionReceipt({
    hash: txHash,
  });

  const block = await client.getBlock({
    blockNumber: tx.blockNumber,
  });

  const data: Prisma.TransactionCreateInput = {
    hash: txHash,
    fromAddress: tx.from,
    toAddress: tx.to,
    chainId,
    block: {
      connectOrCreate: {
        where: {
          hash: tx.blockHash,
        },
        create: {
          number: tx.blockNumber,
          hash: tx.blockHash,
          timestamp: block.timestamp,
          chainId,
        },
      },
    },
  };

  await prisma.transaction.upsert({
    create: data,
    update: data,
    where: {
      hash: txHash,
    },
  });
};

export const logger = initLogger({ serviceName: 'raylac-sync' });
