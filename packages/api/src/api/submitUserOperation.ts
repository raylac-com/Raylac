import { TRPCError } from '@trpc/server';
import {
  decodeExecuteAsTransfer,
  ENTRY_POINT_ADDRESS,
  getPublicClient,
  RAYLAC_ACCOUNT_EXECUTE_FUNC_SIG,
  RAYLAC_PAYMASTER_ADDRESS,
  RaylacAccountAbi,
  sendUserOperation,
  TraceCallAction,
  traceToPostgresRecord,
  traceTransaction,
  UserOperation,
} from '@raylac/shared';
import { decodeFunctionData, Hex, Log, parseAbiItem } from 'viem';
import prisma from '../lib/prisma';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

/**
 * Returns a promise that resolves with the logs when the event is triggered.
 * @returns A promise that resolves with the event log.
 */
const pollUserOpEvent = ({
  userOpHash,
  chainId,
  timeout,
}: {
  userOpHash: Hex;
  chainId: number;
  timeout: number;
}): Promise<Log<bigint, number, boolean, typeof userOpEvent>> => {
  const client = getPublicClient({ chainId });

  return new Promise((resolve, reject) => {
    try {
      let timer: NodeJS.Timeout | null = null;

      const unwatch = client.watchEvent({
        address: ENTRY_POINT_ADDRESS,
        event: userOpEvent,
        args: {
          userOpHash,
        },
        pollingInterval: 500,
        onLogs: logs => {
          // Stop watching for events
          unwatch();

          // Resolve the promise with the logs
          const log = logs[0];

          if (timer) {
            clearTimeout(timer);
          }

          resolve(log);
        },
        onError: error => {
          // Reject the promise if an error occurs
          reject(error);
        },
      });

      timer = setTimeout(() => {
        // Stop watching for events
        unwatch();

        // Reject the promise due to timeout
        reject(new Error('Timeout waiting for event'));
      }, timeout);
    } catch (error) {
      // Catch any errors during the setup
      reject(error);
    }
  });
};

const submitUserOperation = async ({ userOp }: { userOp: UserOperation }) => {
  const client = getPublicClient({ chainId: userOp.chainId });

  const userOpHash = await sendUserOperation({
    client,
    userOp,
  });

  const userOpEventLog = await pollUserOpEvent({
    userOpHash,
    chainId: userOp.chainId,
    timeout: 15000,
  });

  const success = userOpEventLog.args.success!;

  if (!success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User operation failed with success=false',
    });
  }

  const actualGasUsed = userOpEventLog.args.actualGasUsed!;
  const actualGasCost = userOpEventLog.args.actualGasCost!;

  const txHash = userOpEventLog.transactionHash!;
  const blockNumber = userOpEventLog.blockNumber!;
  const blockHash = userOpEventLog.blockHash!;

  // Upsert the block first
  await prisma.block.upsert({
    create: {
      hash: blockHash,
      number: blockNumber,
      chainId: userOp.chainId,
    },
    update: {},
    where: {
      hash: blockHash,
    },
  });

  // Return 400 if the transaction fails

  // Save the UserOperation hash, transaction, and the transfer traces to the database
  // Poll for the UserOperation event

  const data = {
    hash: userOpHash,
    chainId: userOp.chainId,
    sender: userOp.sender,
    paymaster: RAYLAC_PAYMASTER_ADDRESS,
    nonce: parseInt(userOp.nonce, 16),
    actualGasUsed,
    actualGasCost,
    success,
    Transaction: {
      create: {
        hash: txHash,
        blockNumber,
        blockHash,
        chainId: userOp.chainId,
      },
    },
  };

  await prisma.userOperation.upsert({
    create: data,
    update: data,
    where: {
      hash: userOpHash,
    },
  });

  const traces = await traceTransaction({
    chainId: userOp.chainId,
    txHash,
  });

  const executeCallTrace = traces // Get the `type: call` traces
    .find(
      trace =>
        'input' in trace.action &&
        trace.action.callType === 'call' &&
        trace.action.input.startsWith(RAYLAC_ACCOUNT_EXECUTE_FUNC_SIG)
    );

  if (!executeCallTrace) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Transfer trace not found',
    });
  }

  const decoded = decodeFunctionData({
    abi: RaylacAccountAbi,
    data: (executeCallTrace.action as TraceCallAction).input,
  });

  if (decoded.functionName !== 'execute') {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Function name is not `execute`',
    });
  }

  const transferData = decodeExecuteAsTransfer({
    executeArgs: {
      to: decoded.args[0] as Hex,
      value: BigInt(decoded.args[1]),
      data: decoded.args[2] as Hex,
      tag: decoded.args[3] as Hex,
    },
    chainId: userOp.chainId,
  })!;

  // Decode and save the trace

  const record = traceToPostgresRecord({
    transferData,
    traceTxHash: txHash,
    traceTxPosition: executeCallTrace.transactionPosition,
    traceAddress: [...executeCallTrace.traceAddress, 0, 0],
    fromAddress: userOp.sender,
    chainId: userOp.chainId,
  });

  const txData = {
    hash: txHash,
    blockNumber,
    blockHash,
    chainId: userOp.chainId,
  };
  // Create the transaction record
  await prisma.transaction.upsert({
    create: txData,
    update: txData,
    where: {
      hash: txHash,
    },
  });

  await prisma.transferTrace.upsert({
    create: record,
    update: record,
    where: {
      txHash_traceAddress: {
        txHash: txHash,
        traceAddress: record.traceAddress,
      },
    },
  });
};

export default submitUserOperation;
