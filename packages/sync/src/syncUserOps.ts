import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  bigIntMin,
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  ERC20_TRANSFER_FUNC_SIG,
  ERC20Abi,
  getPublicClient,
  getTokenId,
  getTraceId,
  RAYLAC_ACCOUNT_EXECUTE_FUNC_SIG,
  RAYLAC_PAYMASTER_ADDRESS,
  RaylacAccountAbi,
  RaylacAccountExecuteArgs,
  TraceCallAction,
  TraceResponseData,
  traceTransaction,
} from '@raylac/shared';
import {
  decodeFunctionData,
  getAddress,
  Hex,
  Log,
  parseAbiItem,
  parseEventLogs,
  TransactionReceipt,
} from 'viem';
import prisma from './lib/prisma';
import supportedChains from '@raylac/shared/out/supportedChains';
import { updateJobLatestSyncedBlock } from './utils';
import { sleep } from './lib/utils';
import { Prisma } from '@prisma/client';
import logger from './lib/logger';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

/**
 * Decode the arguments of the `execute` function in RaylacAccount.sol
 * Throws an error if the decoded function is not `execute`
 */
const decodeExecuteArgs = (data: Hex): RaylacAccountExecuteArgs => {
  const func = decodeFunctionData({
    abi: RaylacAccountAbi,
    data,
  });

  if (func.functionName !== 'execute') {
    throw new Error('Function name is not `execute`');
  }

  return {
    to: func.args[0],
    value: func.args[1],
    data: func.args[2],
    executionTag: func.args[3],
  };
};

const getExecuteArgs = (trace: TraceResponseData): RaylacAccountExecuteArgs => {
  const func = decodeFunctionData({
    abi: RaylacAccountAbi,
    data: (trace.action as TraceCallAction).input,
  });

  if (func.functionName !== 'execute') {
    throw new Error('Function name is not `execute`');
  }

  const to = getAddress(func.args[0]);
  const value = func.args[1];
  const data = func.args[2];
  const executionTag = func.args[3];

  return {
    to,
    value,
    data,
    executionTag,
  };
};

/**
 * Return the transfer trace upsert db write transaction
 */
const upsertNativeTransferTrace = ({
  trace,
  transferId,
}: {
  trace: TraceResponseData;
  transferId: string;
}) => {
  // The `to` field of the trace is the contract address which the `execute` function is called.
  // So the `from` of the transfer is the `to` of the trace.
  const from = getAddress((trace.action as TraceCallAction).to);

  const { to, value, data } = getExecuteArgs(trace);

  if (data !== '0x') {
    throw new Error(
      `Native transfer call should have empty calldata tx: ${trace.transactionHash}`
    );
  }

  const traceId = getTraceId({
    txHash: trace.transactionHash,
    traceAddress: trace.traceAddress,
  });

  const upsertTraceArgs: Prisma.TraceCreateInput = {
    id: traceId,
    from: from,
    to: to,
    amount: value,
    tokenId: 'eth',
    Transfer: {
      connect: {
        transferId,
      },
    },
    Transaction: {
      connect: {
        hash: trace.transactionHash,
      },
    },
  };

  const upsertTrace = prisma.trace.upsert({
    create: upsertTraceArgs,
    update: upsertTraceArgs,
    where: {
      id: traceId,
    },
  });

  return upsertTrace;
};

const upsertERC20TransferTraces = ({
  txReceipt,
  chainId,
  transferId,
}: {
  txReceipt: TransactionReceipt;
  chainId: number;
  transferId: string;
}) => {
  const logs = parseEventLogs({
    abi: ERC20Abi,
    logs: txReceipt.logs,
    eventName: 'Transfer',
  });

  return logs.map(log => {
    const traceId = getTraceId({
      txHash: log.transactionHash,
      traceAddress: log.logIndex,
    });

    const traceData: Prisma.TraceCreateInput = {
      id: traceId,
      from: getAddress(log.args.from),
      to: getAddress(log.args.to),
      amount: log.args.value,
      tokenId: getTokenId({
        chainId,
        tokenAddress: getAddress(log.address),
      }),
      Transfer: {
        connect: {
          transferId,
        },
      },
      Transaction: {
        connect: {
          hash: log.transactionHash,
        },
      },
    };

    const upsertTrace = prisma.trace.upsert({
      create: traceData,
      update: traceData,
      where: {
        id: traceId,
      },
    });

    return upsertTrace;
  });
};

/**
 * Get the highest block number of the synched user operations.
 */
const getLatestSynchedUserOpBlock = async (
  chainId: number
): Promise<bigint | null> => {
  const syncJobStatus = await prisma.syncStatus.findFirst({
    select: {
      lastSyncedBlockNum: true,
    },
    where: {
      job: 'UserOps',
      chainId,
    },
  });

  return syncJobStatus?.lastSyncedBlockNum ?? null;
};

const upsertBlock = ({
  blockNumber,
  blockHash,
  chainId,
}: {
  blockNumber: bigint;
  blockHash: Hex;
  chainId: number;
}) => {
  const data: Prisma.BlockCreateInput = {
    number: blockNumber,
    hash: blockHash,
    chainId,
  };

  return prisma.block.upsert({
    create: data,
    update: data,
    where: {
      hash: blockHash,
    },
  });
};

const upsertTransaction = ({
  txHash,
  blockHash,
  chainId,
}: {
  txHash: Hex;
  blockHash: Hex;
  chainId: number;
}) => {
  const data: Prisma.TransactionCreateInput = {
    hash: txHash,
    chainId,
    block: {
      connect: {
        hash: blockHash,
      },
    },
  };

  return prisma.transaction.upsert({
    create: data,
    update: data,
    where: {
      hash: txHash,
    },
  });
};

const upsertUserOp = ({
  userOpHash,
  sender,
  paymaster,
  nonce,
  success,
  actualGasCost,
  actualGasUsed,
  chainId,
  txHash,
}: {
  userOpHash: Hex;
  sender: Hex;
  paymaster: Hex;
  nonce: bigint;
  success: boolean;
  actualGasCost: bigint;
  actualGasUsed: bigint;
  chainId: number;
  txHash: Hex;
}) => {
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

  return prisma.userOperation.upsert({
    create: data,
    update: data,
    where: {
      hash: userOpHash,
    },
  });
};

const saveTransfer = async ({
  fromUserId,
  to,
  txReceipt,
  transferId,
}: {
  fromUserId: number;
  to: Hex;
  txReceipt: TransactionReceipt;
  transferId: string;
}) => {
  const upsertTransferArgs: Prisma.TransferCreateInput = {
    fromUser: {
      connect: {
        id: fromUserId,
      },
    },
    transferId,
    maxBlockNumber: txReceipt.blockNumber,
  };

  const toUser = await prisma.userStealthAddress.findUnique({
    select: {
      userId: true,
    },
    where: {
      address: to,
    },
  });

  if (toUser) {
    upsertTransferArgs.toUser = {
      connect: {
        id: toUser.userId,
      },
    };
  } else {
    upsertTransferArgs.toAddress = to;
  }

  return prisma.transfer.upsert({
    create: upsertTransferArgs,
    update: upsertTransferArgs,
    where: {
      transferId,
    },
  });
};

const saveTraces = async ({
  transferId,
  txReceipt,
  chainId,
}: {
  transferId: string;
  txReceipt: TransactionReceipt;
  chainId: number;
}) => {
  const traces = await traceTransaction({
    txHash: txReceipt.transactionHash,
    chainId,
  });

  const raylacAccountExecuteCall = traces.find(trace => {
    return (
      trace.type === 'call' &&
      trace.action.from.toLowerCase() === ENTRY_POINT_ADDRESS.toLowerCase() &&
      trace.action.input.startsWith(RAYLAC_ACCOUNT_EXECUTE_FUNC_SIG)
    );
  });

  if (!raylacAccountExecuteCall) {
    throw new Error(
      `RaylacAccount execute call not found for tx ${txReceipt.transactionHash} on chain ${chainId}`
    );
  }

  const decoded = decodeFunctionData({
    abi: RaylacAccountAbi,
    data: (raylacAccountExecuteCall.action as TraceCallAction).input,
  });

  if (decoded.functionName !== 'execute') {
    throw new Error('Decoded function name is not `execute`');
  }

  const executeCalldata = decoded.args[2] as Hex;

  const isNativeTransfer = executeCalldata === '0x';
  const isERC20Transfer = executeCalldata.startsWith(ERC20_TRANSFER_FUNC_SIG);

  const upserts = [];
  if (isNativeTransfer) {
    const upsertTrace = upsertNativeTransferTrace({
      trace: raylacAccountExecuteCall,
      transferId,
    });

    upserts.push(upsertTrace);
  } else if (isERC20Transfer) {
    const upsertTraces = await upsertERC20TransferTraces({
      txReceipt,
      chainId,
      transferId,
    });

    upserts.push(...upsertTraces);
  } else {
    logger.error(
      `Unknown execute calldata for tx ${txReceipt.transactionHash} on chain ${chainId}`
    );
  }

  return upserts;
};

export const handleBundleTransaction = async ({
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

  const success = userOpEventLogs.every(log => log.args.success);

  if (!success) {
    logger.warn(
      `User operation failed with success=false for tx ${txReceipt.transactionHash} on chain ${chainId}`
    );
    return;
  }

  const publicClient = getPublicClient({ chainId });

  const tx = await publicClient.getTransaction({
    hash: txReceipt.transactionHash,
  });

  const txInput = tx.input;

  // Decode the bundle transaction input
  const decoded = decodeFunctionData({
    abi: EntryPointAbi,
    data: txInput,
  });

  if (decoded.functionName !== 'handleOps') {
    throw new Error('Transaction is not a bundle transaction');
  }

  const userOps = decoded.args[0].filter(userOp =>
    userOp.callData.startsWith(RAYLAC_ACCOUNT_EXECUTE_FUNC_SIG)
  );

  const fromAddresses = userOps.map(userOp => getAddress(userOp.sender));

  const fromUsers = await prisma.userStealthAddress.findMany({
    select: {
      userId: true,
      address: true,
    },
    where: {
      address: { in: fromAddresses },
    },
  });

  if (fromUsers.length === 0) {
    logger.error(
      `No sender found for bundle transaction ${txReceipt.transactionHash} on chain ${chainId}`
    );
    return;
  }

  // Sanity check
  // Check that all from addresses point to the same user
  const fromUserId = fromUsers[0].userId;

  if (!fromUsers.every(user => user.userId === fromUserId)) {
    throw new Error('Sending from multiple users');
  }

  const userOpsExecutionArgs = userOps.map(userOp =>
    decodeExecuteArgs(userOp.callData)
  );

  const executionTag = userOpsExecutionArgs[0].executionTag;

  // Sanity check
  // Check that all user ops have the same execution tag
  if (userOpsExecutionArgs.some(arg => arg.executionTag !== executionTag)) {
    throw new Error('User ops have different execution tags');
  }

  const transferId = executionTag;

  const txHash = txReceipt.transactionHash;
  const blockNumber = txReceipt.blockNumber;
  const blockHash = txReceipt.blockHash;

  const upsertBlockQuery = upsertBlock({
    blockNumber,
    blockHash,
    chainId,
  });

  const upsertTxQuery = upsertTransaction({
    txHash,
    blockHash,
    chainId,
  });

  const finalExecutionArg =
    userOpsExecutionArgs[userOpsExecutionArgs.length - 1];

  const upsertTransfer = await saveTransfer({
    fromUserId,
    to: finalExecutionArg.to,
    txReceipt,
    transferId,
  });

  const upsertTraces = await saveTraces({
    transferId,
    txReceipt,
    chainId,
  });

  // Upsert user ops
  const upsertUserOpsQuery = userOpEventLogs.map(log => {
    return upsertUserOp({
      userOpHash: log.args.userOpHash,
      sender: log.args.sender,
      paymaster: log.args.paymaster,
      nonce: log.args.nonce,
      success: log.args.success,
      actualGasCost: log.args.actualGasCost,
      actualGasUsed: log.args.actualGasUsed,
      chainId,
      txHash,
    });
  });

  await upsertBlockQuery;
  await upsertTxQuery;
  await upsertTransfer;
  await Promise.all(upsertTraces);
  await Promise.all(upsertUserOpsQuery);
};

export const handleUserOpEvent = async ({
  log,
  chainId,
}: {
  log: Log<bigint, number, false>;
  chainId: number;
}) => {
  const txHash = log.transactionHash;

  const publicClient = getPublicClient({ chainId });
  const txReceipt = await publicClient.getTransactionReceipt({
    hash: txHash,
  });

  await handleBundleTransaction({
    txReceipt,
    chainId,
  });

  /*
  const decodedLog = decodeEventLog({
    abi: EntryPointAbi,
    data: log.data,
    topics: log.topics,
  });

  if (decodedLog.eventName !== 'UserOperationEvent') {
    throw new Error('Event name is not `UserOperationEvent`');
  }

  const txHash = log.transactionHash;
  const blockNumber = log.blockNumber;
  const blockHash = log.blockHash;

  const upsertBlockQuery = upsertBlock({
    blockNumber,
    blockHash,
    chainId,
  });

  const upsertTxQuery = upsertTransaction({
    txHash,
    blockHash,
    chainId,
  });

  // Upsert the Transaction and Block

  const upsertTracesQuery = await upsertTransfersForTx({
    txHash: log.transactionHash,
    chainId,
  });

  const upsertUserOpQuery = upsertUserOp({
    userOpHash: decodedLog.args.userOpHash,
    sender: decodedLog.args.sender,
    paymaster: decodedLog.args.paymaster,
    nonce: decodedLog.args.nonce,
    success: decodedLog.args.success,
    actualGasCost: decodedLog.args.actualGasCost,
    actualGasUsed: decodedLog.args.actualGasUsed,
    chainId,
    txHash,
  });

  await prisma.$transaction([
    upsertBlockQuery,
    upsertTxQuery,
    ...upsertTracesQuery,
    upsertUserOpQuery,
  ]);

  logger.info(
    `Upserted UserOperation ${decodedLog.args.userOpHash} for tx ${txHash} on chain ${chainId}`
  );
  */
};

/**
 * Sync user operations for the given chain,
 * from either the latest synched block or the finalized block (from the earlier block)
 * to the latest block
 */
export const syncUserOpsForChain = async (chainId: number) => {
  const client = getPublicClient({ chainId });

  // eslint-disable-next-line security/detect-object-injection
  const accountDeployedBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

  if (!accountDeployedBlock) {
    throw new Error(
      `ACCOUNT_IMPL_DEPLOYED_BLOCK not found for chain ${chainId}`
    );
  }

  const latestSynchedBlock =
    (await getLatestSynchedUserOpBlock(chainId)) || accountDeployedBlock;

  const finalizedBlockNumber = await client.getBlock({
    blockTag: 'finalized',
  });

  if (finalizedBlockNumber.number === null) {
    throw new Error('Finalized block number is null');
  }

  const fromBlock = bigIntMin([
    latestSynchedBlock,
    finalizedBlockNumber.number,
  ]);

  const toBlock = await client.getBlockNumber();

  logger.info(
    `Syncing UserOperations from block ${fromBlock.toLocaleString()} to ${toBlock.toLocaleString()} on chain ${chainId}`
  );
  logger.info(`((${(toBlock - fromBlock).toLocaleString()}) blocks)`);

  const chunkSize = 10000n;

  for (
    let startBlock = fromBlock;
    startBlock <= toBlock;
    startBlock += chunkSize + 1n
  ) {
    const endBlock =
      startBlock + chunkSize <= toBlock ? startBlock + chunkSize : toBlock;

    logger.info(
      `Fetching logs from block ${startBlock.toLocaleString()} to ${endBlock.toLocaleString()} on chain ${chainId}`
    );

    const chunkLogs = await client.getLogs({
      address: ENTRY_POINT_ADDRESS,
      event: userOpEvent,
      args: {
        paymaster: RAYLAC_PAYMASTER_ADDRESS,
      },
      fromBlock: startBlock,
      toBlock: endBlock,
    });

    for (const log of chunkLogs) {
      await handleUserOpEvent({
        log,
        chainId,
      });
    }

    await updateJobLatestSyncedBlock({
      chainId,
      syncJob: 'UserOps',
      blockNumber: endBlock,
    });
  }
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
