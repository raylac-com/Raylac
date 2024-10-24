import { getPublicClient } from '@raylac/shared';
import { AbiEvent, GetLogsReturnType, Hex } from 'viem';
import { getFromBlock, updateJobLatestSyncedBlock } from './utils';
import { SyncJob } from '@prisma/client';

const processLogs = async ({
  chainId,
  address,
  job,
  event,
  args,
  handleLogs,
}: {
  chainId: number;
  address: Hex;
  job: SyncJob;
  event: AbiEvent;
  args?: Record<string, unknown>;
  handleLogs: (logs: GetLogsReturnType<typeof event>) => Promise<void>;
}) => {
  const client = getPublicClient({ chainId });

  const fromBlock = await getFromBlock({
    chainId,
    job: 'UserOps',
  });

  const toBlock = await client.getBlockNumber();

  const chunkSize = 10000n;
  for (
    let startBlock = fromBlock;
    startBlock <= toBlock;
    startBlock += chunkSize + 1n
  ) {
    const endBlock =
      startBlock + chunkSize <= toBlock ? startBlock + chunkSize : toBlock;

    const chunkLogs = await client.getLogs({
      address,
      event,
      args,
      fromBlock: startBlock,
      toBlock: endBlock,
    });

    await handleLogs(chunkLogs);

    await updateJobLatestSyncedBlock({
      chainId,
      syncJob: job,
      blockNumber: endBlock,
    });
  }
};

export default processLogs;
