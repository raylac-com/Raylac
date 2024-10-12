import { TRPCError } from '@trpc/server';
import { EntryPointAbi, getPublicClient, UserOperation } from '@raylac/shared';
import { parseEventLogs } from 'viem';
import { handleBundleTransaction } from '@raylac/sync';
import { handleOps } from '../lib/bundler';
import logger from '../lib/logger';
import prisma from '../lib/prisma';

const MAX_TRANSFERS = 1000;

const canUserSubmitOps = async (userId: number) => {
  // TODO Implement monthly limit

  const numTransfers = await prisma.transfer.count({
    where: {
      fromUserId: userId,
    },
  });

  return numTransfers < MAX_TRANSFERS;
};

const submitUserOps = async ({
  userId,
  userOps,
}: {
  userId: number;
  userOps: UserOperation[];
}) => {
  const canSubmit = await canUserSubmitOps(userId);

  if (!canSubmit) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User has exceeded the maximum number of transfers',
    });
  }

  // Sanity check that all user ops have the same chainId
  const chainIds = userOps.map(userOp => userOp.chainId);
  if (new Set(chainIds).size !== 1) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'All user ops must have the same chainId',
    });
  }

  const chainId = userOps[0].chainId;

  const { txHash } = await handleOps({
    userOps,
    chainId,
  });

  const publicClient = getPublicClient({ chainId });

  const start = Date.now();
  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  const end = Date.now();
  logger.info(`waitForTransactionReceipt ${end - start}ms`);

  const userOpEventLogs = parseEventLogs({
    abi: EntryPointAbi,
    logs: txReceipt.logs,
    eventName: 'UserOperationEvent',
  });

  const success = userOpEventLogs.every(log => log.args.success);

  if (!success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User operation failed with success=false',
    });
  }

  const start2 = Date.now();
  await handleBundleTransaction({
    txReceipt,
    chainId,
  });
  const end2 = Date.now();
  logger.info(`handleBundleTransaction ${end2 - start2}ms`);
};

export default submitUserOps;
