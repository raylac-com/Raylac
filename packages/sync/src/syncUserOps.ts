import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  sleep,
} from '@raylac/shared';
import { decodeEventLog, Log, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import { supportedChains } from '@raylac/shared';
import { upsertTransaction } from './utils';
import { Prisma } from '@prisma/client';
import processLogs from './processLogs';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

export const handleUserOpEvent = async ({
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

  await upsertTransaction({
    txHash,
    chainId,
  });

  const data: Prisma.UserOperationCreateInput = {
    chainId,
    hash: userOpHash,
    sender,
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

/**
 * Index `UserOperationEvent` logs for a given chain.
 * Only `UserOperationEvent` logs with the paymaster set to `RAYLAC_PAYMASTER_ADDRESS` are indexed.
 * @param chainId - The chain to sync user operations for
 * @param fromBlock - (Optional) The block to start syncing from. This is useful for indexing on test environments where we only want to backfill a few blocks
 */
export const syncUserOpsForChain = async ({ chainId }: { chainId: number }) => {
  await processLogs({
    chainId,
    job: 'UserOps',
    address: ENTRY_POINT_ADDRESS,
    event: userOpEvent,
    args: {
      paymaster: RAYLAC_PAYMASTER_V2_ADDRESS,
    },
    handleLogs: async logs => {
      for (const log of logs) {
        await handleUserOpEvent({ log, chainId });
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
const syncUserOps = async () => {
  while (true) {
    const promises = [];

    for (const chainId of supportedChains.map(chain => chain.id)) {
      promises.push(syncUserOpsForChain({ chainId }));
    }

    await Promise.all(promises);

    // TODO: Figure out the right interval
    await sleep(15 * 1000);
  }
};

export default syncUserOps;
