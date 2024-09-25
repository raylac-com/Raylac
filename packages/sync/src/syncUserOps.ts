import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  ENTRY_POINT_ADDRESS,
  getPublicClient,
  RAYLAC_PAYMASTER_ADDRESS,
} from '@raylac/shared';
import { getAddress, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import { Prisma } from '@prisma/client';
import supportedChains from '@raylac/shared/out/supportedChains';
import { updateJobLatestSyncedBlock } from './utils';
import { sleep } from './lib/utils';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

/**
 * Get the highest block number of the synched user operations.
 */
const getLatestSynchedUserOpBlock = async (
  chainId: number
): Promise<bigint | null> => {
  const syncJobStatus = await prisma.syncStatus.findFirst({
    select: {
      lastSyncedBlockNum: true,
    },
    where: {
      job: 'UserOps',
      chainId,
    },
  });

  return syncJobStatus?.lastSyncedBlockNum ?? null;
};

const syncUserOpsByPaymaster = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (const chainId of supportedChains.map(chain => chain.id)) {
      const fromBlock =
        (await getLatestSynchedUserOpBlock(chainId)) ||
        ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

      const client = getPublicClient({ chainId });
      const toBlock = await client.getBlockNumber();

      console.log(
        `Syncing UserOperations from block ${fromBlock.toLocaleString()} to ${toBlock.toLocaleString()} on chain ${chainId}`
      );
      console.log(`((${(toBlock - fromBlock).toLocaleString()}) blocks)`);

      const chunkSize = 2000n;

      for (
        let startBlock = fromBlock;
        startBlock <= toBlock;
        startBlock += chunkSize + 1n
      ) {
        const endBlock =
          startBlock + chunkSize <= toBlock ? startBlock + chunkSize : toBlock;

        try {
          const chunkLogs = await client.getLogs({
            address: ENTRY_POINT_ADDRESS,
            event: userOpEvent,
            args: {
              paymaster: RAYLAC_PAYMASTER_ADDRESS,
            },
            fromBlock: startBlock,
            toBlock: endBlock,
          });

          console.log(
            `Found ${chunkLogs.length} logs from block ${startBlock.toLocaleString()} to ${endBlock.toLocaleString()}`
          );
        } catch (error) {
          console.error(
            `Error fetching logs from block ${startBlock.toString()} to ${endBlock.toString()}:`,
            error
          );
          // Optionally implement retry logic or error handling here
        }

        await updateJobLatestSyncedBlock({
          chainId,
          syncJob: 'UserOps',
          blockNumber: endBlock,
        });
      }
    }

    await sleep(10000); // Sleep for 10 seconds
  }
};

const watchUserOpEvents = async () => {
  // eslint-disable-next-line no-constant-condition
  await Promise.all(
    supportedChains.map(async chain => {
      const chainId = chain.id;
      const client = getPublicClient({ chainId });

      await client.watchEvent({
        address: ENTRY_POINT_ADDRESS,
        event: userOpEvent,
        args: {
          paymaster: RAYLAC_PAYMASTER_ADDRESS,
        },
        onLogs: async logs => {
          for (const log of logs) {
            const {
              userOpHash,
              sender,
              nonce,
              success,
              actualGasCost,
              actualGasUsed,
              paymaster,
            } = log.args;

            const data: Prisma.UserOperationCreateInput = {
              sender: getAddress(sender!),
              hash: userOpHash!,
              nonce: nonce!,
              actualGasCost: actualGasCost!,
              actualGasUsed: actualGasUsed!,
              success: success!,
              chainId: chainId,
              paymaster: getAddress(paymaster!),
              Transaction: {
                connectOrCreate: {
                  where: {
                    hash: log.transactionHash,
                  },
                  create: {
                    hash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    chainId,
                  },
                },
              },
            };

            console.log(`Filling UserOperation ${userOpHash}`);
            await prisma.userOperation.upsert({
              where: {
                hash: userOpHash!,
              },
              update: data,
              create: data,
            });
          }
        },
      });
    })
  );
};

const syncUserOps = async () => {
  await Promise.all([syncUserOpsByPaymaster(), watchUserOpEvents()]);
};

export default syncUserOps;
