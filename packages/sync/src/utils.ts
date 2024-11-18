import { Prisma, SyncJob } from '@raylac/db';
import { anvil, arbitrum, base, optimism, polygon, scroll } from 'viem/chains';
import prisma from './lib/prisma';
import {
  decodeEventLog,
  decodeFunctionData,
  Hex,
  Log,
  parseAbiItem,
  ParseEventLogsReturnType,
} from 'viem';
import {
  bigIntMin,
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  ERC20Abi,
  getChainName,
  getPublicClient,
  RaylacAccountExecuteArgs,
  RaylacAccountV2Abi,
  sleep,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';

export const announcementAbiItem = parseAbiItem(
  'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes viewTag, bytes ephemeralPubKey)'
);

export const RAYLAC_DEPLOYED_BLOCK: {
  [key: number]: bigint;
} = {
  [base.id]: BigInt(22047405),

  // It's 0s on dev chains because we deploy the contracts right after starting the chain
  [anvil.id]: BigInt(0),
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

/**
 * Get the timestamp of a block.
 * This function first checks the database for the block, and if it's not found, it fetches it from the node.
 */
export const getBlockTimestamp = async ({
  chainId,
  blockHash,
}: {
  chainId: number;
  blockHash: Hex;
}) => {
  const blockInDb = await prisma.block.findUnique({
    select: {
      timestamp: true,
    },
    where: {
      hash: blockHash,
    },
  });

  if (blockInDb?.timestamp) {
    return blockInDb.timestamp;
  }

  const client = getPublicClient({ chainId });
  const block = await client.getBlock({ blockHash });

  if (!block) {
    throw new Error(
      `Block ${blockHash} not found for ${getChainName(chainId)}`
    );
  }

  return block.timestamp;
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

  const tx = await client.getTransaction({
    hash: txHash,
  });

  let tag: Hex = '0x';

  if (tx.to === ENTRY_POINT_ADDRESS) {
    const handleOpsInput = decodeFunctionData({
      abi: EntryPointAbi,
      data: tx.input,
    });
    if (handleOpsInput.functionName === 'handleOps') {
      const userOps = handleOpsInput.args[0];

      const executeArgs: RaylacAccountExecuteArgs[] = [];

      for (const userOp of userOps) {
        const data = decodeFunctionData({
          abi: RaylacAccountV2Abi,
          data: userOp.callData,
        });

        if (data.functionName === 'execute') {
          executeArgs.push({
            to: data.args[0],
            value: data.args[1],
            data: data.args[2],
            tag: data.args[3],
          });
        }
      }

      // Check that all execute calls has the same tag
      if (!executeArgs.some(arg => arg.tag !== executeArgs[0].tag)) {
        // All execute calls have the same tag
        tag = executeArgs[0].tag;
      }
    }
  }

  const blockTimestamp = await getBlockTimestamp({
    chainId,
    blockHash: tx.blockHash,
  });

  const blockCreateInput: Prisma.BlockCreateInput = {
    number: tx.blockNumber,
    hash: tx.blockHash,
    timestamp: blockTimestamp,
    chainId,
  };

  try {
    // Sometimes this fails because the chain is going through a reorg
    await prisma.block.upsert({
      create: blockCreateInput,
      update: blockCreateInput,
      where: {
        hash: tx.blockHash,
      },
    });
  } catch (_err) {
    logger.error(
      `Error upserting block ${tx.blockHash} on ${getChainName(chainId)}`
    );
  }

  const data: Prisma.TransactionCreateManyInput = {
    hash: txHash,
    fromAddress: tx.from,
    toAddress: tx.to,
    chainId,
    blockHash: tx.blockHash,
    tag,
  };

  // We use `createMany` instead of `upsert` because,
  // because `upsert` occasionally fails with a unique constraint error. (This is likely due to upserts being run in parallel)
  await prisma.transaction.createMany({
    data: [data],
    skipDuplicates: true,
  });
};

/**
 * Upsert a `UserOperationEvent` log to the database.
 * This function expects that the corresponding `Transaction` has already been created in the database.
 */
export const upsertUserOpEventLog = async ({
  log,
  chainId,
}: {
  log: Log<bigint, number, false>;
  chainId: number;
}) => {
  const decodedLog = decodeEventLog({
    abi: EntryPointAbi,
    data: log.data,
    topics: log.topics,
  });

  if (decodedLog.eventName !== 'UserOperationEvent') {
    throw new Error('Event name is not `UserOperationEvent`');
  }

  const { args } = decodedLog;

  const txHash = log.transactionHash;

  const userOpHash = args.userOpHash;
  const sender = args.sender;
  const paymaster = args.paymaster;
  const nonce = args.nonce;
  const success = args.success;
  const actualGasCost = args.actualGasCost;
  const actualGasUsed = args.actualGasUsed;

  const data: Prisma.UserOperationCreateInput = {
    chainId,
    hash: userOpHash,
    UserStealthAddress: {
      connect: {
        address: sender,
      },
    },
    paymaster,
    nonce: Number(nonce),
    success,
    actualGasCost,
    actualGasUsed,
    Transaction: {
      connect: {
        hash: txHash,
      },
    },
  };

  await prisma.userOperation.upsert({
    create: data,
    update: data,
    where: {
      hash: userOpHash,
    },
  });
};

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
  [anvil.id]: 250,
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
export const waitForAnnouncementsBackfill = async ({
  announcementChainId,
}: {
  announcementChainId: number;
}) => {
  const client = getPublicClient({ chainId: announcementChainId });

  const latestBlock = await client.getBlock({
    blockTag: 'latest',
  });

  while (true) {
    const announcementSyncStatus = await prisma.syncStatus.findUnique({
      where: {
        chainId_job: {
          chainId: announcementChainId,
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

/**
 * Loop function with error handling
 */
export const loop = async ({
  fn,
  interval,
}: {
  fn: () => Promise<void>;
  interval: number;
}) => {
  while (true) {
    try {
      await fn();
    } catch (err) {
      logger.error(err);
    }

    await sleep(interval);
  }
};
