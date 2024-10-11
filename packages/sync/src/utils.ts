import { Prisma, SyncJob } from '@prisma/client';
import prisma from './lib/prisma';
import { Hex, parseAbiItem, ParseEventLogsReturnType } from 'viem';
import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  ERC20Abi,
  getTokenId,
  getTraceId,
} from '@raylac/shared';

export const announcementAbiItem = parseAbiItem(
  'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes viewTag, bytes ephemeralPubKey)'
);

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

/*
export const getReorgedTxs = async (
  expectedBlockHashes: {
    blockNumber: bigint;
    blockHash: Hex;
    chainId: number;
  }[]
) => {
  const txs = await prisma.transaction.findMany({
    select: {
      hash: true,
      blockNumber: true,
      blockHash: true,
    },
    where: {
      blockNumber: {
        in: expectedBlockHashes.map(tx => tx.blockNumber),
      },
    },
  });

  return txs.filter(tx => {
    const expectedBlockHash = expectedBlockHashes.find(
      e => e.blockNumber === tx.blockNumber
    )?.blockHash;

    if (!expectedBlockHash) {
      throw new Error(
        `Expected block hash not found for block number ${tx.blockNumber}`
      );
    }

    return tx.blockHash !== expectedBlockHash;
  });
};

export const buildReorgedTxsWhereClause = (
  txs: {
    blockNumber: bigint;
    blockHash: Hex;
    chainId: number;
  }[]
) => {
  const blocks = txs.map(tx => ({
    AND: {
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      chainId: tx.chainId,
    },
  }));

  return {
    NOT: {
      OR: blocks,
    },
  };
};
*/

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

export const upsertBlock = ({
  blockNumber,
  blockHash,
  chainId,
}: {
  blockNumber: bigint;
  blockHash: Hex;
  chainId: number;
}) => {
  const data: Prisma.BlockCreateInput = {
    number: blockNumber,
    hash: blockHash,
    chainId,
  };

  return prisma.block.upsert({
    create: data,
    update: data,
    where: {
      hash: blockHash,
    },
  });
};

export const upsertTransaction = ({
  txHash,
  blockHash,
  chainId,
}: {
  txHash: Hex;
  blockHash: Hex;
  chainId: number;
}) => {
  const data: Prisma.TransactionCreateInput = {
    hash: txHash,
    chainId,
    block: {
      connect: {
        hash: blockHash,
      },
    },
  };

  return prisma.transaction.upsert({
    create: data,
    update: data,
    where: {
      hash: txHash,
    },
  });
};

/**
 * Save an ERC20 transfer log to the database.
 * Throws an error if the log is not a Transfer event log.
 */
export const saveERC20TransferLog = ({
  log,
  chainId,
  traceAddress,
  executionTag,
}: {
  log: ERC20TransferLogType;
  chainId: number;
  traceAddress: number[];
  executionTag: Hex;
}) => {
  const tokenId = getTokenId({
    chainId,
    tokenAddress: log.address,
  });

  const from = log.args.from;
  const to = log.args.to;
  const amount = log.args.value;

  const transferId = executionTag;

  const traceId = getTraceId({
    txHash: log.transactionHash,
    traceAddress,
  });

  const traceData: Prisma.TraceCreateInput = {
    id: traceId,
    from: from,
    to: to,
    amount,
    tokenId,
    Transfer: {
      connect: {
        transferId,
      },
    },
    Transaction: {
      connect: {
        hash: log.transactionHash,
      },
    },
  };

  const upsertTrace = prisma.trace.upsert({
    create: traceData,
    update: traceData,
    where: {
      id: traceId,
    },
  });

  return upsertTrace;
};
