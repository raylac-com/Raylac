import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  getPublicClient,
  sleep,
  traceBlockByNumber,
} from '@raylac/shared';
import { BlockTransactionResponse } from '@raylac/shared/out/types';
import { Hex, hexToBigInt, isAddress, toBytes } from 'viem';
import prisma from './lib/prisma';
import { IGNORE_ADDRESSES, logger } from './utils';
import supportedChains from '@raylac/shared/out/supportedChains';

interface TraceWithTraceAddress extends BlockTransactionResponse {
  txHash: Hex;
  traceAddress: number[];
}

/**
 * Get traces that all calls recursively.
 * (Filters out static calls, delegate calls, etc.)
 * - Assigns traceAddress to each call.
 */
const getCalls = (
  tx: BlockTransactionResponse,
  txHash: Hex,
  traceAddress: number[] = []
): TraceWithTraceAddress[] => {
  if (tx.calls) {
    return tx.calls
      .filter(call => call.type === 'CALL')
      .flatMap((call, index) =>
        getCalls(call, txHash, [...traceAddress, index])
      );
  }

  return [{ ...tx, txHash, traceAddress }];
};

const getBlockTraces = async ({
  chainId,
  blockNumber,
}: {
  chainId: number;
  blockNumber: bigint;
}) => {
  const traceBlockResult = await traceBlockByNumber({
    blockNumber,
    chainId,
  });

  const callsInBlock = traceBlockResult.flatMap(tx =>
    getCalls(tx.result, tx.txHash)
  );

  const callsWithValue = callsInBlock
    // Filter out calls with no value
    .filter(
      call =>
        call.value &&
        call.value !== '0x0' &&
        isAddress(call.to, {
          strict: false,
        }) &&
        isAddress(call.from, {
          strict: false,
        })
    )
    // Filter out calls to known contract addresses
    .filter(call => !IGNORE_ADDRESSES.has(call.to?.toLowerCase()));

  const data = callsWithValue.map(call => ({
    from: Buffer.from(toBytes(call.from)),
    to: Buffer.from(toBytes(call.to)),
    amount: hexToBigInt(call.value).toString(),
    traceAddress: call.traceAddress.join('_'),
    chainId,
    transactionHash: call.txHash,
    blockNumber,
  }));

  return data;
};

const getLatestSynchedTrace = async (chainId: number) => {
  const latestTrace = await prisma.nativeTransferTrace.findFirst({
    select: {
      blockNumber: true,
    },
    where: {
      chainId,
    },
    orderBy: {
      blockNumber: 'desc',
    },
  });

  return latestTrace;
};

export const syncNativeTransfersForChain = async (chainId: number) => {
  try {
    const latestSyncedTrace = await getLatestSynchedTrace(chainId);

    let fromBlock: bigint;

    // We'd need to get traces from the account implementation deployed block anyways.
    // And we'd need to get traces from the latest synched block as well?

    // Maybe we just need to pay the compute units

    if (latestSyncedTrace) {
      fromBlock = latestSyncedTrace.blockNumber;
    } else {
      // eslint-disable-next-line security/detect-object-injection
      const accountImplDeployedBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

      if (accountImplDeployedBlock === undefined) {
        throw new Error(
          `Account implementation not deployed for chain ${chainId}`
        );
      }

      fromBlock = accountImplDeployedBlock;
    }

    const client = getPublicClient({ chainId });

    // Get the latest block number
    const toBlock = await client.getBlockNumber();

    logger.info(
      `Syncing traces in ${toBlock - fromBlock} blocks for chain ${chainId}`
    );

    const startTime = Date.now();
    const batchSize = 25n;
    for (let blockNumber = fromBlock; blockNumber <= toBlock; ) {
      const tracePromises = [];

      for (let i = 0; i < batchSize; i++) {
        tracePromises.push(
          getBlockTraces({
            blockNumber: blockNumber + BigInt(i),
            chainId,
          })
        );
      }

      try {
        const startTime = Date.now();
        const traces = await Promise.all(tracePromises);

        const startWriteTime = Date.now();
        await prisma.nativeTransferTrace.createMany({
          data: traces.flat(),
          skipDuplicates: true,
        });
        const endWriteTime = Date.now();

        logger.info(
          `Wrote ${traces.flat().length} traces to db in ${endWriteTime - startWriteTime}ms`
        );

        const endTime = Date.now();
        const bps = (
          Number(batchSize) /
          ((endTime - startTime) / 1000)
        ).toFixed(2);
        logger.info(
          `Synced ${batchSize} blocks in ${endTime - startTime}ms for chain ${chainId} (${bps} bps)`
        );

        blockNumber += batchSize;
      } catch (error) {
        logger.error(
          `Error syncing traces for block ${blockNumber} on chain ${chainId}: ${error}`
        );

        logger.info(`Retrying from block ${blockNumber}`);
      }
    }

    const endTime = Date.now();
    logger.info(
      `Synced traces for ${toBlock - fromBlock} blocks in ${endTime - startTime}ms for chain ${chainId}`
    );
  } catch (error) {
    logger.error(`Error syncing traces for chain ${chainId}: ${error}`);

    logger.info(`Retrying in 5 seconds`);

    await sleep(5000);
  }
};

const syncAllNativeTransfers = async () => {
  while (true) {
    const chainSyncJobs = [];
    for (const chain of supportedChains) {
      chainSyncJobs.push(syncNativeTransfersForChain(chain.id));
    }

    await Promise.all(chainSyncJobs);

    await sleep(3000);
  }
};

export default syncAllNativeTransfers;
