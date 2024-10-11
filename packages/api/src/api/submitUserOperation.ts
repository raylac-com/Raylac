import { TRPCError } from '@trpc/server';
import { EntryPointAbi, getPublicClient, UserOperation } from '@raylac/shared';
import { parseEventLogs } from 'viem';
import { handleUserOpEvent } from '@raylac/sync';
import { handleOps } from '../lib/bundler';

const submitUserOperation = async ({ userOp }: { userOp: UserOperation }) => {
  const { txHash, userOpHashes } = await handleOps({
    userOps: [userOp],
    chainId: userOp.chainId,
  });

  const userOpHash = userOpHashes[0];

  const publicClient = getPublicClient({ chainId: userOp.chainId });

  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  const userOpEventLogs = parseEventLogs({
    abi: EntryPointAbi,
    logs: txReceipt.logs,
    eventName: 'UserOperationEvent',
  });

  if (userOpEventLogs.length !== 1) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Expected 1 user operation event log, got ${userOpEventLogs.length}`,
    });
  }

  const userOpEventLog = userOpEventLogs[0];

  if (userOpEventLog.args.userOpHash !== userOpHash) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User operation hash mismatch',
    });
  }

  const success = userOpEventLog.args.success;

  if (!success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User operation failed with success=false',
    });
  }

  await handleUserOpEvent({
    log: userOpEventLog,
    chainId: userOp.chainId,
  });
};

export default submitUserOperation;
