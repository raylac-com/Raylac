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
  getUserOpHash,
  getWebsocketClient,
  UserOperation,
} from '@raylac/shared';
import {
  getAddress,
  Hex,
  parseEventLogs,
  toHex,
  TransactionReceipt,
} from 'viem';
import { handleOps } from '../lib/bundler';
import {
  handleERC20TransferLog,
  upsertTransaction,
  upsertUserOpEventLog,
} from '@raylac/sync';
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

const upsertUserAction = async ({
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

  return await prisma.userAction.upsert({
    where: {
      txHashes,
    },
    update: data,
    create: data,
  });
};

/**
 * Handles a transaction on a chain.
 *
 * This includes:
 * - Decoding the arguments of the `execute` function called on the account contract
 * - Parsing the transaction receipt for user ops and traces
 * - Saving user ops and traces to the db
 */
const handleTxOnChain = async ({
  txHash,
  chainId,
  userOps,
  tokenPrice,
}: {
  txHash: Hex;
  chainId: number;
  userOps: UserOperation[];
  tokenPrice?: number;
}) => {
  // Decode the arguments of the `execute` function called on the account contract
  // We use the arguments to determine the action that was performed
  const executeArgs = userOps.map(decodeUserOpCalldata);

  // Check if this is a native transfer
  const isNativeTransfer = executeArgs[0].data === '0x';

  const websocketClient = getWebsocketClient({ chainId });
  const txReceipt = await websocketClient.waitForTransactionReceipt({
    hash: txHash,
  });

  await upsertTransaction({
    txHash,
    chainId,
  });

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
          tokenPriceAtTrace: tokenPrice,
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
        handleERC20TransferLog({ log, tokenId, chainId, tokenPrice })
      )
    );
  }

  return txReceipt;
};

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

const saveUserOpEventLogsForTx = async ({
  txReceipt,
  chainId,
}: {
  txReceipt: TransactionReceipt;
  chainId: number;
}) => {
  const userOpEventLogs = parseEventLogs({
    abi: EntryPointAbi,
    logs: txReceipt.logs,
    eventName: 'UserOperationEvent',
  });

  await Promise.all(
    userOpEventLogs.map(log => upsertUserOpEventLog({ log, chainId }))
  );
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

  validateUserOps({ userOps, isNativeTransfer });

  // Group user ops by chain id
  const userOpsByChainId: Record<number, UserOperation[]> = {};
  for (const userOp of userOps) {
    userOpsByChainId[userOp.chainId] = [
      ...(userOpsByChainId[userOp.chainId] ?? []),
      userOp,
    ];
  }

  // Submit user ops on each chain concurrently
  const start = Date.now();
  const txReceipts = await Promise.all(
    Object.entries(userOpsByChainId).flatMap(async ([_chainId, userOps]) => {
      const chainId = Number(_chainId);
      const { txHash } = await handleOps({ userOps, chainId });

      logger.info(`submitted tx ${txHash} on ${getChainName(chainId)}`);

      const txReceipt = await handleTxOnChain({
        txHash,
        chainId,
        userOps,
        tokenPrice,
      });

      return { chainId, ...txReceipt };
    })
  );
  const end = Date.now();
  logger.info(`submitUserOps ${end - start}ms`);

  // Check if all transactions were successfuls
  const txsSuccess = txReceipts.every(
    txReceipt => txReceipt.status === 'success'
  );

  // Check if all user ops in the transactions were successful
  for (const txReceipt of txReceipts) {
    const userOpEventLogs = parseEventLogs({
      abi: EntryPointAbi,
      logs: txReceipt.logs,
      eventName: 'UserOperationEvent',
    });

    if (userOpEventLogs.some(log => !log.args.success)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'One or more user operations failed',
      });
    }
  }

  await Promise.all(
    txReceipts.map(txReceipt =>
      saveUserOpEventLogsForTx({ txReceipt, chainId: txReceipt.chainId })
    )
  );

  // Create the `UserAction` record
  const transfer = await upsertUserAction({
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
    transferId: transfer.id,
    txHashes: txReceipts.map(txReceipt => txReceipt.transactionHash),
  };
};

export default submitUserOps;
