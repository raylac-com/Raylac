import { TRPCError } from '@trpc/server';
import {
  ENTRY_POINT_ADDRESS,
  getPublicClient,
  RAYLAC_PAYMASTER_ADDRESS,
  sendUserOperation,
  traceTransaction,
  UserOperation,
} from '@raylac/shared';
import { Hex, hexToBigInt, Log, parseAbiItem } from 'viem';
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
            console.log('Clearing timeout');
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

  console.log(`User operation ${userOpHash} success: ${success}`);

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

  // Return 400 if the transaction fails

  // Save the UserOperation hash, transaction, and the transfer traces to the database
  // Poll for the UserOperation event

  const data = {
    hash: userOpHash,
    chainId: userOp.chainId,
    sender: userOp.sender,
    paymaster: RAYLAC_PAYMASTER_ADDRESS,
    nonce: hexToBigInt(userOp.nonce),
    actualGasUsed,
    actualGasCost,
    Transaction: {
      create: {
        hash: txHash,
        blockNumber,
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

  await traceTransaction({
    chainId: userOp.chainId,
    txHash,
  });

  // Decode and save the trace
};

export default submitUserOperation;
