import { TRPCError } from '@trpc/server';
import {
  ENTRY_POINT_ADDRESS,
  getPublicClient,
  sendUserOperation,
  UserOperation,
} from '@raylac/shared';
import { Hex, Log, parseAbiItem } from 'viem';
import { handleUserOpEvent } from '@raylac/sync';

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
}): Promise<Log<bigint, number, false, typeof userOpEvent>> => {
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

  await handleUserOpEvent({
    log: userOpEventLog,
    chainId: userOp.chainId,
  });
};

export default submitUserOperation;
