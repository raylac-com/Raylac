import { ENTRY_POINT_ADDRESS, getPublicClient } from '@raylac/shared';
import { Hex, Log, parseAbiItem } from 'viem';
import {
  loop,
  upsertTransaction,
  upsertUserOpEventLog,
  waitForAnnouncementsBackfill,
} from './utils';
import { logger } from '@raylac/shared-backend';
import prisma from './lib/prisma';
import { bigIntMin } from '@raylac/shared/src/utils';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

const handleUserOpEvent = async ({
  log,
  chainId,
}: {
  log: Log<bigint, number, false>;
  chainId: number;
}) => {
  await upsertTransaction({
    txHash: log.transactionHash,
    chainId,
  });

  await upsertUserOpEventLog({ log, chainId });
};

/**
 * Index `UserOperationEvent` logs for a given chain.
 * Only `UserOperationEvent` logs with the paymaster set to `RAYLAC_PAYMASTER_ADDRESS` are indexed.
 * @param chainId - The chain to sync user operations for
 * @param fromBlock - (Optional) The block to start syncing from. This is useful for indexing on test environments where we only want to backfill a few blocks
 */
export const syncUserOpsForChain = async ({ chainId }: { chainId: number }) => {
  const publicClient = getPublicClient({ chainId });

  await loop({
    interval: 10 * 1000,
    async fn() {
      const syncTasks = await prisma.syncTask.findMany({
        select: {
          blockNumber: true,
          chainId: true,
          address: true,
        },
        where: {
          tokenId: 'userOps',
          chainId,
        },
        orderBy: {
          blockNumber: 'asc',
        },
      });

      if (syncTasks.length === 0) {
        return;
      }

      const fromBlock = syncTasks[0].blockNumber;
      const latestBlockNumber = await publicClient.getBlockNumber();

      const addressBatchSize = 100;
      const blockBatchSize = 100000n;

      for (
        let blockNumber = fromBlock;
        blockNumber <= latestBlockNumber;
        blockNumber += blockBatchSize
      ) {
        const toBlock = bigIntMin([
          blockNumber + blockBatchSize,
          latestBlockNumber,
        ]);

        const addressesToSync = syncTasks
          .filter(address => address.blockNumber < toBlock)
          .map(address => address.address as Hex);

        if (addressesToSync.length === 0) {
          continue;
        }

        for (let i = 0; i < addressesToSync.length; i += addressBatchSize) {
          const batch = addressesToSync.slice(i, i + addressBatchSize);

          const logs = await publicClient.getLogs({
            address: ENTRY_POINT_ADDRESS,
            event: userOpEvent,
            fromBlock,
            toBlock,
            args: {
              sender: batch,
            },
          });

          for (const log of logs) {
            await handleUserOpEvent({ log, chainId });
          }

          // Update the address sync statuses to the latest block number
          await prisma.syncTask.updateMany({
            data: {
              blockNumber: toBlock,
            },
            where: {
              address: { in: batch },
              chainId,
              tokenId: 'userOps',
            },
          });
        }
      }
    },
  });
};

/**
 * Continuously index `UserOperationEvent` logs across all supported chains.
 *
 * NOTE: UserOperations are saved to the database synchronously when a user
 * submits a user operation from the Raylac app.
 * Therefore we only need this indexing job to make sure we index UserOperations
 * that failed to be indexed for any reason.
 */
const syncUserOps = async ({
  announcementChainId,
  chainIds,
}: {
  announcementChainId: number;
  chainIds: number[];
}) => {
  logger.info('syncUserOps: Waiting for announcements backfill to complete');
  await waitForAnnouncementsBackfill({ announcementChainId });
  logger.info(`syncUserOps: Announcements backfill complete`);

  await loop({
    interval: 15 * 1000,
    async fn() {
      const promises = [];

      for (const chainId of chainIds) {
        promises.push(syncUserOpsForChain({ chainId }));
      }

      await Promise.all(promises);
    },
  });
};

export default syncUserOps;
