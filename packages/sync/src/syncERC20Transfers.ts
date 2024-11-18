import { bigIntMin, ERC20Abi, getPublicClient, sleep } from '@raylac/shared';
import { supportedTokens } from '@raylac/shared';
import { decodeEventLog, getAddress, Hex, Log, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import {
  updateAddressesSyncStatus,
  upsertTransaction,
  waitForAnnouncementsBackfill,
} from './utils';
import { logger } from '@raylac/shared-backend';

import { Prisma } from '@raylac/db';

export const handleERC20TransferLog = async ({
  log,
  tokenId,
  chainId,
  tokenPrice,
}: {
  log: Log<bigint, number, false>;
  tokenId: string;
  chainId: number;
  tokenPrice?: number;
}) => {
  const decodedLog = decodeEventLog({
    abi: ERC20Abi,
    data: log.data,
    topics: log.topics,
  });

  if (decodedLog.eventName !== 'Transfer') {
    throw new Error('Event name is not `Transfer`');
  }

  const { args } = decodedLog;

  const from = getAddress(args.from);
  const to = getAddress(args.to);

  await upsertTransaction({
    txHash: log.transactionHash,
    chainId,
  });

  const data: Prisma.TraceCreateInput = {
    from,
    to,
    tokenId,
    amount: args.value.toString(),
    logIndex: log.logIndex,
    Transaction: {
      connect: {
        hash: log.transactionHash,
      },
    },
    tokenPriceAtTrace: tokenPrice ?? null,
    chainId,
  };

  const toUserExists = await prisma.userStealthAddress.findUnique({
    where: { address: to },
  });

  if (toUserExists) {
    data.UserStealthAddressTo = { connect: { address: to } };
  }

  const fromUserExists = await prisma.userStealthAddress.findUnique({
    where: { address: from },
  });

  if (fromUserExists) {
    data.UserStealthAddressFrom = { connect: { address: from } };
  }

  await prisma.trace.upsert({
    create: data,
    update: data,
    where: {
      transactionHash_logIndex: {
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
      },
    },
  });

  logger.info(
    `Inserted ${tokenId} transfer ${log.transactionHash} on ${chainId}`
  );
};

export const syncERC20TransfersForChain = async ({
  chainId,
  tokenId,
  tokenAddress,
}: {
  chainId: number;
  tokenId: string;
  tokenAddress: Hex;
}) => {
  const addressSyncStatuses = await prisma.addressSyncStatus.findMany({
    select: {
      blockNumber: true,
      chainId: true,
      address: true,
    },
    where: {
      tokenId,
      chainId,
    },
    orderBy: {
      blockNumber: 'asc',
    },
  });

  if (addressSyncStatuses.length === 0) {
    return;
  }

  const client = getPublicClient({ chainId });

  const addressBatchSize = 100;
  const blockBatchSize = 100000n;

  for (let i = 0; i < addressSyncStatuses.length; i += addressBatchSize) {
    // TODO: Try not to call this here every time
    const latestBlockNumber = await client.getBlockNumber();

    const batch = addressSyncStatuses.slice(i, i + addressBatchSize);

    const fromBlock = batch[0].blockNumber;

    for (
      let blockNumber = fromBlock;
      blockNumber <= latestBlockNumber;
      blockNumber += blockBatchSize
    ) {
      const toBlock = bigIntMin([
        blockNumber + blockBatchSize,
        latestBlockNumber,
      ]);

      const addressesToSync = batch
        .filter(address => address.blockNumber < toBlock)
        .map(address => address.address as Hex);

      if (addressesToSync.length === 0) {
        continue;
      }

      const incomingLogs = await client.getLogs({
        address: tokenAddress,
        event: parseAbiItem(
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ),
        args: {
          to: addressesToSync,
        },
        fromBlock,
        toBlock,
      });

      const outgoingLogs = await client.getLogs({
        address: tokenAddress,
        event: parseAbiItem(
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ),
        args: {
          from: addressesToSync,
        },
        fromBlock,
        toBlock,
      });

      // Handle logs concurrently
      const handleLogsPromises = [];
      for (const log of [...incomingLogs, ...outgoingLogs]) {
        handleLogsPromises.push(
          handleERC20TransferLog({ log, tokenId, chainId })
        );
      }
      await Promise.all(handleLogsPromises);

      await updateAddressesSyncStatus({
        addresses: addressesToSync,
        chainId,
        tokenId,
        blockNumber: toBlock,
      });
    }
  }
};

const syncERC20Transfers = async ({
  announcementChainId,
  chainIds,
}: {
  announcementChainId: number;
  chainIds: number[];
}) => {
  logger.info(
    'syncERC20Transfers: Waiting for announcements backfill to complete'
  );
  // We need to wait for ERC5554 announcements to be backfilled before syncing ERC20 transfers,
  // because we use the ERC5554 events to find the stealth addresses to sync ERC20 transfers for
  await waitForAnnouncementsBackfill({ announcementChainId });
  logger.info(`syncERC20Transfers: Announcements backfill complete`);

  const erc20Tokens = supportedTokens.filter(token => token.tokenId !== 'eth');

  while (true) {
    try {
      const allTokensSyncPromises = [];
      for (const token of erc20Tokens) {
        // Sync ERC20 transfers for each chain concurrently
        const syncOnChainsPromises = [];
        for (const tokenOnChain of token.addresses) {
          const chainId = tokenOnChain.chain.id;

          if (!chainIds.includes(chainId)) {
            continue;
          }

          syncOnChainsPromises.push(
            syncERC20TransfersForChain({
              chainId,
              tokenId: token.tokenId,
              tokenAddress: tokenOnChain.address,
            })
          );
        }

        allTokensSyncPromises.push(...syncOnChainsPromises);
      }

      await Promise.all(allTokensSyncPromises);
    } catch (err) {
      logger.error(err);
    }

    await sleep(5 * 1000);
  }
};

export default syncERC20Transfers;
