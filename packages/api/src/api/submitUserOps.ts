import { TRPCError } from '@trpc/server';
import {
  decodeUserOpCalldata,
  EntryPointAbi,
  ERC20Abi,
  getPublicClient,
  getTokenId,
  getUserOpHash,
  traceTransaction,
  UserOperation,
} from '@raylac/shared';
import { parseEventLogs } from 'viem';
import { handleOps } from '../lib/bundler';
import { handleERC20TransferLog, handleNewTrace } from '@raylac/sync';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { handleUserOpEvent } from '@raylac/sync/src/syncUserOps';
import { Prisma } from '@prisma/client';

const MAX_TRANSFERS = 1000;

const canUserSubmitOps = async (userId: number) => {
  // TODO Implement monthly limit

  const numTransfers = await prisma.transaction.count({
    where: {
      traces: {
        some: {
          UserStealthAddressFrom: { userId },
        },
      },
    },
  });

  return numTransfers < MAX_TRANSFERS;
};

const upsertUserOps = async ({
  userOps,
  tokenPrice,
}: {
  userOps: UserOperation[];
  tokenPrice?: number;
}) => {
  const data: Prisma.UserOperationCreateInput[] = userOps.map(userOp => ({
    hash: getUserOpHash({ userOp }),
    chainId: userOp.chainId,
    tokenPriceAtOp: tokenPrice ?? null,
  }));

  await prisma.userOperation.createMany({
    data,
    skipDuplicates: true,
  });
};

const submitUserOps = async ({
  userId,
  tokenPrice,
  userOps,
}: {
  userId: number;
  tokenPrice?: number;
  userOps: UserOperation[];
}) => {
  const canSubmit = await canUserSubmitOps(userId);

  if (!canSubmit) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `User ${userId} has exceeded the maximum number of transfers`,
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

  // Sanity check that all user ops are pointing to the same token
  const executeArgs = userOps.map(decodeUserOpCalldata);
  const isNativeTransfer = executeArgs[0].data === '0x';

  if (isNativeTransfer) {
    if (!executeArgs.every(args => args.data === '0x')) {
      const invalidOps = executeArgs.filter(args => args.data !== '0x');
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Native transfers must have empty data. Found ${JSON.stringify(
          invalidOps
        )}`,
      });
    }
  } else {
    const tokenAddresses = executeArgs[0].to;

    if (!executeArgs.every(args => args.to === tokenAddresses)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `All user ops must point to the same token. Found ${tokenAddresses} and ${executeArgs.map(
          args => args.to
        )}`,
      });
    }
  }

  // Save the token price at the time of the user operation
  await upsertUserOps({ userOps, tokenPrice });

  const chainId = userOps[0].chainId;

  const { txHash } = await handleOps({
    userOps,
    chainId,
  });

  const publicClient = getPublicClient({ chainId });

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

  // Save user ops and traces to the db

  try {
    await Promise.all(
      userOpEventLogs.map(log => handleUserOpEvent({ log, chainId }))
    );

    if (isNativeTransfer) {
      const start = Date.now();
      const traces = await traceTransaction({
        txHash,
        chainId,
      });
      const end = Date.now();
      logger.info(`traceTransaction ${end - start}ms`);

      await Promise.all(
        traces.map(trace => handleNewTrace({ trace, chainId }))
      );
    } else {
      const tokenAddresses = executeArgs[0].to;

      const tokenId = getTokenId({
        chainId,
        tokenAddress: tokenAddresses,
      });

      const transferLogs = parseEventLogs({
        abi: ERC20Abi,
        logs: txReceipt.logs,
        eventName: 'Transfer',
      });

      await Promise.all(
        transferLogs.map(log =>
          handleERC20TransferLog({ log, tokenId, chainId })
        )
      );
    }
  } catch (err) {
    logger.error(err);
  }

  const success = userOpEventLogs.every(log => log.args.success);

  // Inform the client that the user operation failed
  if (!success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `User operation failed with success=false (txHash: ${txHash})`,
    });
  }
};

export default submitUserOps;
