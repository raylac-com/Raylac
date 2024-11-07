import * as winston from 'winston';
import { Prisma, SyncJob } from '@prisma/client';
import { anvil, arbitrum, base, optimism, polygon, scroll } from 'viem/chains';
import prisma from './lib/prisma';
import { Hex, parseAbiItem, ParseEventLogsReturnType } from 'viem';
import { bigIntMin, ERC20Abi, getPublicClient, sleep } from '@raylac/shared';

export const announcementAbiItem = parseAbiItem(
  'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes viewTag, bytes ephemeralPubKey)'
);

export const RAYLAC_DEPLOYED_BLOCK: {
  [key: number]: bigint;
} = {
  [base.id]: BigInt(22047405),
  [anvil.id]: BigInt(0), // It's 0 on anvil before we deploy the contracts right after starting the chain
};

/**
 * Get the block height at which the Raylac contracts were deployed for a chain.
 */
export const getRaylacDeployedBlock = ({
  chainId,
}: {
  chainId: number;
}): bigint => {
  // We allow specifying a custom deployed block value.
  // This is useful for testing when we only want to index from a certain block and not the entire history.
  if (process.env.RAYLAC_DEPLOYED_BLOCK) {
    return BigInt(process.env.RAYLAC_DEPLOYED_BLOCK);
  }

  // eslint-disable-next-line security/detect-object-injection
  const raylacAccountDeployedBlock = RAYLAC_DEPLOYED_BLOCK[chainId];

  return raylacAccountDeployedBlock;
};

export const getFromBlock = async ({
  chainId,
  job,
}: {
  chainId: number;
  job: SyncJob;
}) => {
  const raylacAccountDeployedBlock = getRaylacDeployedBlock({ chainId });

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

export const updateAddressesSyncStatus = async ({
  addresses,
  chainId,
  tokenId,
  blockNumber,
}: {
  addresses: Hex[];
  chainId: number;
  tokenId: string;
  blockNumber: bigint;
}) => {
  // Update sync status records for addresses that have one
  await prisma.addressSyncStatus.updateMany({
    data: {
      blockHash: '0x',
      blockNumber,
    },
    where: {
      address: {
        in: addresses,
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

  const blockCreateInput: Prisma.BlockCreateInput = {
    number: tx.blockNumber,
    hash: tx.blockHash,
    chainId,
  };

  await prisma.block.upsert({
    create: blockCreateInput,
    update: blockCreateInput,
    where: {
      hash: tx.blockHash,
    },
  });

  const data: Prisma.TransactionCreateManyInput = {
    hash: txHash,
    fromAddress: tx.from,
    toAddress: tx.to,
    chainId,
    blockHash: tx.blockHash,
  };

  await prisma.transaction.createMany({
    data: [data],
    skipDuplicates: true,
  });
};

const DATADOG_API_KEY = process.env.DATADOG_API_KEY;

const SERVICE_NAME = 'raylac-sync';

const httpTransportOptions = {
  host: 'http-intake.logs.ap1.datadoghq.com',
  path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&service=${SERVICE_NAME}`,
  ssl: true,
};

const useDatadog = !!DATADOG_API_KEY;

if (useDatadog) {
  console.log('Sending logs to Datadog');
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: useDatadog
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
  exitOnError: false,
  transports: useDatadog
    ? [
        new winston.transports.Http(httpTransportOptions),
        new winston.transports.Console(),
      ]
    : [new winston.transports.Console()],
});

export const getApproxChainBlockTime = async (
  chainId: number
): Promise<number> => {
  const client = getPublicClient({ chainId });
  const latestBlock = await client.getBlock({
    blockTag: 'latest',
  });

  const compareBlock = await client.getBlock({
    blockNumber: latestBlock.number - 10n,
  });

  const timeDiff = latestBlock.timestamp - compareBlock.timestamp;

  return Number(timeDiff) / 10;
};

export const CHAIN_BLOCK_TIME: Record<number, number> = {
  [base.id]: 2000,
  [arbitrum.id]: 250,
  [optimism.id]: 2000,
  [scroll.id]: 3000,
  [polygon.id]: 2000,
};

export const CHAIN_GENESIS_BLOCK_TIME: Record<number, number> = {
  [base.id]: 1686789347,
  [arbitrum.id]: 1622243344,
  [optimism.id]: 1636665399,
  [scroll.id]: 1696917614,
  [polygon.id]: 1590856200,
};

/**
 * Get the block number on a chain from a timestamp
 */
export const getBlockNumFromTimestamp = async ({
  chainId,
  timestamp,
}: {
  chainId: number;
  timestamp: number;
}) => {
  const client = getPublicClient({ chainId });

  // eslint-disable-next-line security/detect-object-injection
  const genesisBlockTime = CHAIN_GENESIS_BLOCK_TIME[chainId];

  // eslint-disable-next-line security/detect-object-injection
  const chainBlockTime = CHAIN_BLOCK_TIME[chainId];

  const chainLatestBlockNumber = await client.getBlockNumber();

  // Estimate the block number from the timestamp
  let estimatedBlockNumber = Math.floor(
    (timestamp - genesisBlockTime) / (chainBlockTime / 1000)
  );

  let attempts = 0;
  while (true) {
    if (estimatedBlockNumber > Number(chainLatestBlockNumber)) {
      estimatedBlockNumber = Number(chainLatestBlockNumber);
    }

    const estimatedBlock = await client.getBlock({
      blockNumber: BigInt(estimatedBlockNumber),
    });

    const estimatedBlockTimestamp = Number(estimatedBlock.timestamp);

    const diff = Math.abs(estimatedBlockTimestamp - timestamp);

    if (diff < 60) {
      break;
    }

    const beta = timestamp - estimatedBlockTimestamp;

    estimatedBlockNumber =
      estimatedBlockNumber + Math.floor(beta / (chainBlockTime / 1000));

    attempts++;

    if (attempts > 10) {
      throw new Error('Too many attempts to get block number from timestamp');
    }
  }

  return BigInt(estimatedBlockNumber);
};

/**
 * Resolves when the ERC5554 announcements backfills to the latest block
 */
export const waitForAnnouncementsBackfill = async () => {
  const client = getPublicClient({ chainId: base.id }); // TODO: Use the constant to specify the chain

  const latestBlock = await client.getBlock({
    blockTag: 'latest',
  });

  while (true) {
    const announcementSyncStatus = await prisma.syncStatus.findUnique({
      where: {
        chainId_job: {
          chainId: base.id,
          job: SyncJob.Announcements,
        },
      },
    });

    if (!announcementSyncStatus) {
      continue;
    }

    if (announcementSyncStatus.lastSyncedBlockNum >= latestBlock.number) {
      break;
    }

    await sleep(3000);
  }
};

export interface Timer {
  startTime: number;
  label: string;
}

export const startTimer = (label: string): Timer => {
  return {
    startTime: Date.now(),
    label,
  };
};

export const endTimer = (timer: Timer) => {
  const endTime = Date.now();
  const duration = endTime - timer.startTime;
  logger.info(`${timer.label} took ${duration}ms`);
};
