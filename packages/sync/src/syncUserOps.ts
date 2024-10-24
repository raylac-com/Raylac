import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  RAYLAC_PAYMASTER_ADDRESS,
} from '@raylac/shared';
import { decodeEventLog, Log, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import supportedChains from '@raylac/shared/out/supportedChains';
import { upsertTransaction } from './utils';
import { sleep } from './lib/utils';
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
 * Sync user operations for the given chain,
 * from either the latest synched block or the finalized block (from the earlier block)
 * to the latest block
 */
export const syncUserOpsForChain = async (chainId: number) => {
  await processLogs({
    chainId,
    job: 'UserOps',
    address: ENTRY_POINT_ADDRESS,
    event: userOpEvent,
    args: {
      paymaster: RAYLAC_PAYMASTER_ADDRESS,
    },
    handleLogs: async logs => {
      for (const log of logs) {
        await handleUserOpEvent({ log, chainId });
      }
    },
  });
};

const syncUserOpsByPaymaster = async () => {
  while (true) {
    for (const chainId of supportedChains.map(chain => chain.id)) {
      await syncUserOpsForChain(chainId);
    }

    await sleep(15 * 1000); // Sleep for 15 seconds
  }
};

const syncUserOps = async () => {
  await syncUserOpsByPaymaster();
};

export default syncUserOps;
