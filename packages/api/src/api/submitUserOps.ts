import { TRPCError } from '@trpc/server';
import {
  decodeUserOpCalldata,
  decodeUserOperationContext,
  EntryPointAbi,
  ERC20Abi,
  getChainName,
  getNativeTransferTracesInBlock,
  getPublicClient,
  getTokenId,
  getWebsocketClient,
  UserOperation,
} from '@raylac/shared';
import {
  decodeEventLog,
  getAddress,
  Hex,
  hexToBigInt,
  parseEventLogs,
  TransactionReceipt,
} from 'viem';
import { handleOps } from '../lib/bundler';
import { upsertTransaction, upsertUserOpEventLog } from '@raylac/sync';
import { logger, safeUpsert } from '@raylac/shared-backend';
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

/**
 * Get the timestamp of a block from the RPC
 */
const getBlockTimestamp = async ({
  chainId,
  blockNumber,
}: {
  chainId: number;
  blockNumber: bigint;
}) => {
  const publicClient = getPublicClient({ chainId });
  const block = await publicClient.getBlock({ blockNumber });

  return block.timestamp;
};

/**
 * Creates the `UserAction` record for the UserOperations
 */
const saveUserAction = async ({
  userOps,
  txReceipts,
}: {
  userOps: UserOperation[];
  txReceipts: (TransactionReceipt & { chainId: number })[];
}) => {
  const executeArgs = userOps.map(decodeUserOpCalldata);

  const contexts = executeArgs.map(args => args.tag);

  const decodedContexts = contexts.map(context =>
    decodeUserOperationContext({
      txHash: txReceipts[0].transactionHash,
      context,
    })
  );

  const multiChainTag = decodedContexts[0].multiChainTag;
  const numChains = decodedContexts[0].numChains;

  // TODO: Get the timestamp from the chain that has the fastest RPC endpoint
  const blockTimestamp = await getBlockTimestamp({
    chainId: txReceipts[0].chainId,
    blockNumber: txReceipts[0].blockNumber,
  });

  const txHashes = txReceipts.map(tx => tx.transactionHash).sort();

  const data: Prisma.UserActionCreateInput = {
    timestamp: blockTimestamp,
    transactions: {
      connect: txHashes.map(hash => ({ hash })),
    },
    txHashes,
    groupTag: multiChainTag,
    groupSize: numChains,
  };

  const userAction = await safeUpsert(() =>
    prisma.userAction.upsert({
      where: { txHashes: txHashes },
      create: data,
      update: data,
    })
  );

  return userAction;
};

/**
 * Save the native transfer traces as `Trace` records to the db
 */
const saveNativeTransferTraces = async ({
  txReceipt,
  chainId,
  tokenPrice,
  userOpSenderAddresses,
  toStealthAddress,
}: {
  txReceipt: TransactionReceipt;
  chainId: number;
  tokenPrice: number;
  userOpSenderAddresses: Hex[];
  toStealthAddress?: Hex;
}) => {
  const tracesWithValueInBlocks = await getNativeTransferTracesInBlock({
    blockNumber: txReceipt.blockNumber,
    chainId,
  });

  const txTraces = tracesWithValueInBlocks.filter(
    call => call.txHash === txReceipt.transactionHash
  );

  if (txTraces.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `No native transfer traces found for tx ${txReceipt.transactionHash}`,
    });
  }

  const traceCreateInput = txTraces.map(trace => {
    const from = getAddress(trace.from);

    const data: Prisma.TraceCreateManyInput = {
      from,
      to: getAddress(trace.to),
      amount: hexToBigInt(trace.value).toString(),
      tokenId: 'eth',
      transactionHash: txReceipt.transactionHash,
      chainId,
      traceAddress: trace.traceAddress.join('_'),
      tokenPriceAtTrace: tokenPrice,
    };

    // Set the `fromStealthAddress` field if the `from` address is a UserOperation sender
    if (userOpSenderAddresses.includes(from)) {
      data.fromStealthAddress = from;
    }

    // Set the `toStealthAddress` field if the recipient is a Raylac user
    if (toStealthAddress) {
      data.toStealthAddress = toStealthAddress;
    }

    return data;
  });

  await prisma.trace.createMany({
    data: traceCreateInput,
    skipDuplicates: true,
  });
};

/**
 * Save the ERC20 Transfer logs as `Trace` records to the db
 */
const saveERC20TransferLogs = async ({
  txReceipt,
  chainId,
  tokenPrice,
  tokenId,
  userOpSenderAddresses,
  toStealthAddress,
}: {
  txReceipt: TransactionReceipt;
  chainId: number;
  tokenPrice: number;
  tokenId: string;
  userOpSenderAddresses: Hex[];
  toStealthAddress?: Hex;
}) => {
  const transferLogs = parseEventLogs({
    abi: ERC20Abi,
    logs: txReceipt.logs,
    eventName: 'Transfer',
  });

  // Array of `Trace` records to create
  const traceCreateInput: Prisma.TraceCreateManyInput[] = [];

  // Iterate over each `Transfer` log and create the input for the `Trace` record
  for (const log of transferLogs) {
    const decodedLog = decodeEventLog({
      abi: ERC20Abi,
      data: log.data,
      topics: log.topics,
    });

    if (decodedLog.eventName !== 'Transfer') {
      throw new Error('Event name is not `Transfer`');
    }

    const { args } = decodedLog;

    const from = getAddress(args.from);
    const to = getAddress(args.to);

    const data: Prisma.TraceCreateManyInput = {
      from,
      to,
      tokenId,
      amount: args.value.toString(),
      transactionHash: txReceipt.transactionHash,
      logIndex: log.logIndex,
      chainId,
      tokenPriceAtTrace: tokenPrice,
    };

    // Set the `fromStealthAddress` field if the `from` address is a UserOperation sender
    if (userOpSenderAddresses.includes(from)) {
      data.fromStealthAddress = from;
    }

    // Set the `toStealthAddress` field if the recipient is a Raylac user
    if (toStealthAddress) {
      data.toStealthAddress = toStealthAddress;
    }

    traceCreateInput.push(data);
  }

  await prisma.trace.createMany({
    data: traceCreateInput,
    skipDuplicates: true,
  });
};

/**
 * Validate an array of user ops
 * Throws an error if the user ops are invalid
 * TODO: Check checksums of the addresses (e.g. UserOperation sender)
 */
const validateUserOps = ({
  userOps,
  isNativeTransfer,
}: {
  userOps: UserOperation[];
  isNativeTransfer: boolean;
}) => {
  const executeArgs = userOps.map(decodeUserOpCalldata);

  if (isNativeTransfer) {
    // Check that all execute calls have empty calldata
    if (!executeArgs.every(args => args.data === '0x')) {
      // Get the user ops that are not native transfers
      const invalidOps = executeArgs.filter(args => args.data !== '0x');

      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Native transfers must have empty data. Found ${JSON.stringify(
          invalidOps
        )}`,
      });
    }
  } else {
    // Check that all execute calls point the same token address
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

  const userOpContexts = executeArgs.map(args => args.tag);
  const decodedContexts = userOpContexts.map(tag =>
    decodeUserOperationContext({
      // We don't need to provide the tx hash to validate the context because
      // the tx hash is used only as a fallback for the multiChain tag when the
      // decoding fails
      txHash: '0x',
      context: tag,
    })
  );

  if (
    !decodedContexts.every(
      context => context.multiChainTag === decodedContexts[0].multiChainTag
    )
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `All user ops must have the same multi-chain tag`,
    });
  }
};

/**
 * Save the UserOperationEvent logs for a transaction
 */
const saveUserOpEventLos = async ({
  txReceipt,
  chainId,
}: {
  txReceipt: TransactionReceipt;
  chainId: number;
}) => {
  // Get all the UserOperationEvent logs from the transaction
  const userOpEventLogs = parseEventLogs({
    abi: EntryPointAbi,
    logs: txReceipt.logs,
    eventName: 'UserOperationEvent',
  });

  await Promise.all(
    userOpEventLogs.map(log => upsertUserOpEventLog({ log, chainId }))
  );
};

const submitUserOpsForChain = async ({
  chainId,
  userOps,
  tokenPrice,
  tokenId,
  toStealthAddress,
}: {
  chainId: number;
  userOps: UserOperation[];
  tokenPrice: number;
  tokenId: string;
  toStealthAddress?: Hex;
}) => {
  // Call the EntryPoint's `handleOps` function
  const { txHash } = await handleOps({ userOps, chainId });

  logger.info(`submitted tx ${txHash} on ${getChainName(chainId)}`);
  const websocketClient = getWebsocketClient({ chainId });

  const txReceipt = await websocketClient.waitForTransactionReceipt({
    hash: txHash,
  });

  await upsertTransaction({
    txHash: txReceipt.transactionHash,
    chainId,
  });

  const userOpSenderAddresses = userOps.map(userOp => userOp.sender);

  if (tokenId === 'eth') {
    await saveNativeTransferTraces({
      txReceipt,
      chainId,
      tokenPrice,
      toStealthAddress,
      userOpSenderAddresses,
    });
  } else {
    await saveERC20TransferLogs({
      txReceipt,
      chainId,
      tokenPrice,
      tokenId,
      toStealthAddress,
      userOpSenderAddresses,
    });
  }

  await saveUserOpEventLos({ txReceipt, chainId });

  return { chainId, ...txReceipt };
};

const submitUserOps = async ({
  userId,
  toStealthAddress,
  tokenPrice,
  userOps,
}: {
  userId: number;
  toStealthAddress?: Hex;
  tokenPrice: number;
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

  const tokenId = isNativeTransfer
    ? 'eth'
    : getTokenId({
        chainId: userOps[0].chainId,
        tokenAddress: executeArgs[0].to,
      });

  validateUserOps({ userOps, isNativeTransfer });

  // Mapping of chainId to UserOps to submit
  const userOpsByChainId: Record<number, UserOperation[]> = {};

  // Group user ops by chain id
  for (const userOp of userOps) {
    userOpsByChainId[userOp.chainId] = [
      ...(userOpsByChainId[userOp.chainId] ?? []),
      userOp,
    ];
  }

  const start = Date.now();

  // Array of `submitUserOpsForChain` promises
  const submitPromises = [];

  // Submit user ops on each chain concurrently
  for (const [chainId, userOps] of Object.entries(userOpsByChainId)) {
    submitPromises.push(
      submitUserOpsForChain({
        chainId: Number(chainId),
        userOps,
        tokenPrice,
        tokenId,
        toStealthAddress,
      })
    );
  }
  const txReceipts = await Promise.all(submitPromises);
  const end = Date.now();
  logger.info(`submitUserOps ${end - start}ms`);

  // Check if all transactions were successful
  const txsSuccess = txReceipts.every(
    txReceipt => txReceipt.status === 'success'
  );

  // Check if the `success` field in the UserOperationEvent logs are all true
  for (const txReceipt of txReceipts) {
    const userOpEventLogs = parseEventLogs({
      abi: EntryPointAbi,
      logs: txReceipt.logs,
      eventName: 'UserOperationEvent',
    });

    if (userOpEventLogs.some(log => !log.args.success)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'One or more UserOperation failed',
      });
    }
  }

  // Create the `UserAction` record
  const userAction = await saveUserAction({
    userOps,
    txReceipts,
  });

  // Inform the client that the user operation failed
  if (!txsSuccess) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'One or more transactions failed',
    });
  }

  return {
    transferId: userAction.id,
    txHashes: txReceipts.map(txReceipt => txReceipt.transactionHash),
  };
};

export default submitUserOps;
