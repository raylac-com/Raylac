import { TRPCError } from '@trpc/server';
import {
  EntryPointAbi,
  ERC20Abi,
  getPublicClient,
  getTokenId,
  UserOperation,
} from '@raylac/shared';
import { parseEventLogs } from 'viem';
import { handleOps } from '../lib/bundler';
import logger from '../lib/logger';
import { handleUserOpEvent } from '@raylac/sync/src/syncUserOps';
import { handleERC20TransferLog } from '@raylac/sync';

const submitUserOp = async ({ userOp }: { userOp: UserOperation }) => {
  const { txHash } = await handleOps({
    userOps: [userOp],
    chainId: userOp.chainId,
  });

  const publicClient = getPublicClient({ chainId: userOp.chainId });

  logger.info(`waiting tx ${txHash} to confirm`);
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

  try {
    await Promise.all(
      userOpEventLogs.map(log =>
        handleUserOpEvent({ log, chainId: userOp.chainId })
      )
    );
  } catch (err) {
    logger.error(err);
  }

  const success = userOpEventLogs.every(log => log.args.success);

  try {
    const chainId = userOp.chainId;
    await Promise.all(
      userOpEventLogs.map(log => handleUserOpEvent({ log, chainId }))
    );

    const transferLogs = parseEventLogs({
      abi: ERC20Abi,
      logs: txReceipt.logs,
      eventName: 'Transfer',
    });

    await Promise.all(
      transferLogs.map(async log => {
        const tokenId = getTokenId({
          chainId,
          tokenAddress: log.address,
        });
        //        console.log({ tokenId, tokenAddress: log.address });

        await handleERC20TransferLog({ log, tokenId, chainId });
      })
    );
  } catch (err) {
    logger.error(err);
  }

  // Inform the client that the user operation failed
  if (!success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `User operation failed with success=false (txHash: ${txHash})`,
    });
  }
};

export default submitUserOp;
