import {
  ENTRY_POINT_ADDRESS,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  sleep,
} from '@raylac/shared';
import { Log, parseAbiItem } from 'viem';
import { upsertTransaction, upsertUserOpEventLog } from './utils';
import processLogs from './processLogs';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

const handleUserOpEvent = async ({
  log,
  chainId,
}: {
  log: Log<bigint, number, false>;
  chainId: number;
}) => {
  await upsertTransaction({
    txHash: log.transactionHash,
    chainId,
  });

  await upsertUserOpEventLog({ log, chainId });
};

/**
 * Index `UserOperationEvent` logs for a given chain.
 * Only `UserOperationEvent` logs with the paymaster set to `RAYLAC_PAYMASTER_ADDRESS` are indexed.
 * @param chainId - The chain to sync user operations for
 * @param fromBlock - (Optional) The block to start syncing from. This is useful for indexing on test environments where we only want to backfill a few blocks
 */
export const syncUserOpsForChain = async ({ chainId }: { chainId: number }) => {
  await processLogs({
    chainId,
    job: 'UserOps',
    address: ENTRY_POINT_ADDRESS,
    event: userOpEvent,
    args: {
      paymaster: RAYLAC_PAYMASTER_V2_ADDRESS,
    },
    handleLogs: async logs => {
      for (const log of logs) {
        await handleUserOpEvent({ log, chainId });
      }
    },
  });
};

/**
 * Continuously index `UserOperationEvent` logs across all supported chains.
 *
 * NOTE: UserOperations are saved to the database synchronously when a user
 * submits a user operation from the Raylac app.
 * Therefore we only need this indexing job to make sure we index UserOperations
 * that failed to be indexed for any reason.
 */
const syncUserOps = async ({ chainIds }: { chainIds: number[] }) => {
  while (true) {
    const promises = [];

    for (const chainId of chainIds) {
      promises.push(syncUserOpsForChain({ chainId }));
    }

    await Promise.all(promises);

    // TODO: Figure out the right interval
    await sleep(15 * 1000);
  }
};

export default syncUserOps;
