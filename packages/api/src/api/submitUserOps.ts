import { TRPCError } from '@trpc/server';
import { EntryPointAbi, getPublicClient, UserOperation } from '@raylac/shared';
import { parseEventLogs } from 'viem';
import { handleBundleTransaction } from '@raylac/sync';
import { handleOps } from '../lib/bundler';

const submitUserOperation = async (userOps: UserOperation[]) => {
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

  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

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

  await handleBundleTransaction({
    txReceipt,
    chainId,
  });
};

export default submitUserOperation;
