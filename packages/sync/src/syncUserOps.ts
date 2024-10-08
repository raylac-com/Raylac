import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  bigIntMin,
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  ERC20_TRANSFER_FUNC_SIG,
  ERC20Abi,
  getPublicClient,
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
  decodeEventLog,
  decodeFunctionData,
  getAddress,
  Hex,
  Log,
  parseAbiItem,
  parseEventLogs,
} from 'viem';
import prisma from './lib/prisma';
import supportedChains from '@raylac/shared/out/supportedChains';
import { saveERC20TransferLog, updateJobLatestSyncedBlock } from './utils';
import { sleep } from './lib/utils';
import { Prisma } from '@prisma/client';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import logger from './lib/logger';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

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

const upsertERC20Transfer = async ({
  txHash,
  trace,
  chainId,
}: {
  txHash: Hex;
  trace: TraceResponseData;
  chainId: number;
}) => {
  const client = getPublicClient({
    chainId,
  });
  const txReceipt = await client.getTransactionReceipt({
    hash: txHash,
  });

  const logs = parseEventLogs({
    abi: ERC20Abi,
    logs: txReceipt.logs,
  });

  const chainSupportedTokenAddresses = supportedTokens
    .map(token => token.addresses.find(address => address.chain.id === chainId))
    .filter(token => token !== undefined)
    .map(token => token.address);

  const transferLogs = logs
    .filter(log => log.eventName === 'Transfer')
    .filter(log =>
      chainSupportedTokenAddresses.includes(getAddress(log.address) as Hex)
    );

  const from = getAddress(transferLogs[0].args.from);
  const to = getAddress(transferLogs[0].args.to);

  const { executionTag } = getExecuteArgs(trace);
  console.log(`from: ${from}, to: ${to}, executionTag: ${executionTag}`);

  const transferId = executionTag;

  const fromUser = await prisma.userStealthAddress.findUnique({
    select: {
      userId: true,
    },
    where: {
      address: from,
    },
  });

  const toUser = await prisma.userStealthAddress.findUnique({
    select: {
      userId: true,
    },
    where: {
      address: to,
    },
  });

  const data: Prisma.TransferCreateInput = {
    transferId,
    maxBlockNumber: transferLogs.sort(
      (a, b) => Number(b.blockNumber) - Number(a.blockNumber)
    )[0].blockNumber,
  };

  if (fromUser) {
    data.fromUser = {
      connect: {
        id: fromUser.userId,
      },
    };
  } else {
    data.fromAddress = from;
  }

  if (toUser) {
    data.toUser = {
      connect: {
        id: toUser.userId,
      },
    };
  } else {
    data.toAddress = to;
  }

  const upsertTransfer = prisma.transfer.upsert({
    create: data,
    update: data,
    where: {
      transferId,
    },
  });

  return [
    upsertTransfer,
    ...transferLogs.map(log => {
      return saveERC20TransferLog({
        log,
        chainId,
        executionTag,
        traceAddress: trace.traceAddress,
      });
    }),
  ];
};

/**
 * Return the transfer trace upsert db write transaction
 */
const upsertNativeTransfer = async ({
  trace,
}: {
  trace: TraceResponseData;
}) => {
  // The `to` field of the trace is the contract address which the `execute` function is called.
  // So the `from` of the transfer is the `to` of the trace.
  const from = getAddress((trace.action as TraceCallAction).to);

  const { to, value, data, executionTag } = getExecuteArgs(trace);

  if (data !== '0x') {
    throw new Error(
      `Native transfer call should have empty calldata tx: ${trace.transactionHash}`
    );
  }

  const transferId = executionTag;

  const upsertTransferArgs: Prisma.TransferCreateInput = {
    transferId,
    maxBlockNumber: trace.blockNumber,
  };

  const fromUser = await prisma.userStealthAddress.findUnique({
    select: {
      userId: true,
    },
    where: {
      address: from,
    },
  });

  const toUser = await prisma.userStealthAddress.findUnique({
    select: {
      userId: true,
    },
    where: {
      address: to,
    },
  });

  if (fromUser) {
    upsertTransferArgs.fromUser = {
      connect: {
        id: fromUser.userId,
      },
    };
  } else {
    upsertTransferArgs.fromAddress = from;
  }

  if (toUser) {
    upsertTransferArgs.toUser = {
      connect: {
        id: toUser.userId,
      },
    };
  } else {
    upsertTransferArgs.toAddress = to;
  }

  const upsertTransfer = prisma.transfer.upsert({
    create: upsertTransferArgs,
    update: upsertTransferArgs,
    where: {
      transferId,
    },
  });

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

  return [upsertTransfer, upsertTrace];
};

/**
 * Return the query to upsert the transaction and transfer trace
 */
export const upsertTransfersForTx = async ({
  txHash,
  chainId,
}: {
  txHash: Hex;
  chainId: number;
}) => {
  const traces = await traceTransaction({
    txHash,
    chainId,
  });

  const upserts = [];
  for (const trace of traces) {
    // Boolean indicating if the call is from the entry point
    const isCallFromEntryPoint =
      trace.action.from === ENTRY_POINT_ADDRESS.toLowerCase();

    // Boolean indicating if the trace is a call (and not a `create`)
    const isCall = trace.type === 'call';

    if (!isCallFromEntryPoint || !isCall) {
      // Skip the trace if it is not a call from the entry point
      //or if it is not a call
      continue;
    }

    // Boolean indicating if the call is to the `execute` function in RaylacAccount.sol
    const isExecuteCall = trace.action.input.startsWith(
      RAYLAC_ACCOUNT_EXECUTE_FUNC_SIG
    );

    if (!isExecuteCall) {
      // Skip the trace if it is not a call to the `execute` function
      continue;
    }

    // Decode the arguments of the `execute` function

    const decoded = decodeFunctionData({
      abi: RaylacAccountAbi,
      data: trace.action.input,
    });

    const executeCalldata = decoded.args[2] as Hex;

    const isNativeTransfer = executeCalldata === '0x';
    const isERC20Transfer = executeCalldata.startsWith(ERC20_TRANSFER_FUNC_SIG);

    if (isERC20Transfer) {
      const upsertTraces = await upsertERC20Transfer({
        txHash,
        chainId,
        trace,
      });

      upserts.push(...upsertTraces);
    } else if (isNativeTransfer) {
      const upsertTraces = await upsertNativeTransfer({
        trace,
      });

      upserts.push(...upsertTraces);
    } else {
      logger.error(
        `Unknown execute calldata for tx ${txHash} on chain ${chainId}`
      );
    }
  }

  return upserts;
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
};

const syncUserOpsByPaymaster = async () => {
  while (true) {
    for (const chainId of supportedChains.map(chain => chain.id)) {
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
    }

    await sleep(15 * 1000); // Sleep for 15 seconds
  }
};

const syncUserOps = async () => {
  await syncUserOpsByPaymaster();
};

export default syncUserOps;
