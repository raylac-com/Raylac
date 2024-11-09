import { TRPCError } from '@trpc/server';
import {
  decodeUserOpCalldata,
  EntryPointAbi,
  ERC20Abi,
  getNativeTransferTracesInBlock,
  getTokenId,
  getUserOpHash,
  getWebsocketClient,
  UserOperation,
} from '@raylac/shared';
import { getAddress, parseEventLogs, toHex } from 'viem';
import { handleOps } from '../lib/bundler';
import { handleERC20TransferLog, handleUserOpEvent } from '@raylac/sync';
import { logger } from '@raylac/shared-backend';
import prisma from '../lib/prisma';
import { Prisma } from '@raylac/db';

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

  // TODO: Sanity check that all user ops have the same tag

  // Save the token price at the time of the user operation
  await upsertUserOps({ userOps, tokenPrice });

  const chainId = userOps[0].chainId;

  const { txHash } = await handleOps({
    userOps,
    chainId,
  });

  //  const publicClient = getPublicClient({ chainId });
  const websocketClient = getWebsocketClient({ chainId });

  logger.info(`waiting tx ${txHash} to confirm`);
  const start = Date.now();
  const txReceipt = await websocketClient.waitForTransactionReceipt({
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
      const callsWithValue = await getNativeTransferTracesInBlock({
        blockNumber: txReceipt.blockNumber,
        chainId,
      });

      const txTraces = callsWithValue.filter(call => call.txHash === txHash);

      if (txTraces.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `No native transfer traces found for tx ${txHash}`,
        });
      }

      const traceCreateInput: Prisma.TraceCreateManyInput[] = await Promise.all(
        userOps.map(async userOp => {
          const { to, value: amount } = decodeUserOpCalldata(userOp);

          const toUser = await prisma.userStealthAddress.findUnique({
            select: { address: true },
            where: { address: to },
          });

          const trace = txTraces.find(
            call =>
              getAddress(call.from) === userOp.sender &&
              getAddress(call.to) === to &&
              call.value === toHex(amount)
          );

          if (!trace) {
            const userOpHash = getUserOpHash({ userOp });
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `No native transfer trace found for user op ${userOpHash} in ${txHash}`,
            });
          }

          return {
            from: userOp.sender,
            to,
            fromStealthAddress: userOp.sender,
            toStealthAddress: toUser?.address || null,
            amount: amount.toString(),
            tokenId: 'eth',
            chainId,
            traceAddress: trace.traceAddress.join('_'),
            transactionHash: txHash,
          };
        })
      );

      await prisma.trace.createMany({
        data: traceCreateInput,
        skipDuplicates: true,
      });
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

  return txHash;
};

export default submitUserOps;
