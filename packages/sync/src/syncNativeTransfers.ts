import {
  bigIntMin,
  getPublicClient,
  traceFilter,
  TraceResponseData,
} from '@raylac/shared';
import { getAddress, Hex, toHex } from 'viem';
import prisma from './lib/prisma';
import { Prisma } from '@prisma/client';
import supportedChains from '@raylac/shared/out/supportedChains';
import { sleep } from './lib/utils';
import {
  getLatestBlockHeight,
  getMinSynchedBlockForAddresses,
  updateAddressesSyncStatus,
  upsertTransaction,
} from './utils';
import logger from './lib/logger';
import { getTokenPriceAtTime } from './lib/coingecko';

export const handleNewTrace = async ({
  trace,
  chainId,
  tokenPrice,
}: {
  trace: TraceResponseData;
  chainId: number;
  tokenPrice?: number;
}) => {
  if (trace.type === 'create') {
    // `type` can be either 'call' or 'create'.
    // Skip all 'create' traces.
    return;
  }

  if (trace.action.value === '0x0') {
    // Skip all traces with a zero value
    return;
  }

  if (trace.action.callType !== 'call') {
    // Skip all non-call traces
    return;
  }

  await upsertTransaction({
    txHash: trace.transactionHash,
    chainId,
  });

  const traceAddress = trace.traceAddress.join('_');

  const from = getAddress(trace.action.from);
  const to = getAddress(trace.action.to);

  const data: Prisma.TraceCreateInput = {
    from,
    to,
    amount: BigInt(trace.action.value),
    tokenId: 'eth',
    traceAddress,
    Transaction: {
      connect: {
        hash: trace.transactionHash,
      },
    },
    tokenPriceAtTrace: tokenPrice,
    chainId,
  };

  const toUserExists = await prisma.userStealthAddress.findUnique({
    where: { address: to },
  });

  if (toUserExists) {
    data.UserStealthAddressTo = { connect: { address: to } };
  }

  const fromUserExists = await prisma.userStealthAddress.findUnique({
    where: { address: from },
  });

  if (fromUserExists) {
    data.UserStealthAddressFrom = { connect: { address: from } };
  }

  await prisma.trace.upsert({
    create: data,
    update: data,
    where: {
      transactionHash_traceAddress: {
        transactionHash: trace.transactionHash,
        traceAddress,
      },
    },
  });
};

const getBlockTimestamp = async ({
  blockNumber,
  chainId,
}: {
  blockNumber: bigint;
  chainId: number;
}) => {
  const block = await prisma.block.findUnique({
    where: {
      number_chainId: {
        number: blockNumber,
        chainId,
      },
    },
  });

  if (!block) {
    return null;
  }

  return block.timestamp;
};

/**
 * Sync native transfers for a batch of addresses
 */
const batchSyncNativeTransfers = async ({
  addresses,
  fromBlock,
  toBlock,
  chainId,
}: {
  addresses: Hex[];
  fromBlock: bigint;
  toBlock: bigint;
  chainId: number;
}) => {
  console.time(`trace_filter ${chainId}`);
  logger.info(`tracing from ${fromBlock} to ${toBlock} on chain ${chainId}`);
  const incomingTraces = await traceFilter({
    fromBlock: toHex(fromBlock),
    toBlock: toHex(toBlock),
    toAddress: addresses,
    chainId,
  });

  const outgoingTraces = await traceFilter({
    fromBlock: toHex(fromBlock),
    toBlock: toHex(toBlock),
    fromAddress: addresses,
    chainId,
  });

  console.timeEnd(`trace_filter ${chainId}`);

  for (const trace of [...incomingTraces, ...outgoingTraces]) {
    const blockTimestamp = await getBlockTimestamp({
      blockNumber: BigInt(trace.blockNumber),
      chainId,
    });

    const tokenPrice = blockTimestamp
      ? await getTokenPriceAtTime('eth', Number(blockTimestamp))
      : undefined;

    await handleNewTrace({ trace, chainId, tokenPrice });
  }
};

const syncNativeTransfers = async () => {
  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
      },
    });

    await Promise.all(
      supportedChains.map(async ({ id: chainId }) => {
        const client = getPublicClient({ chainId });
        const finalizedBlockNumber = await client.getBlock({
          blockTag: 'finalized',
        });

        if (finalizedBlockNumber.number === null) {
          throw new Error('Finalized block number is null');
        }

        // Sync native transfers in 100 address batches
        for (let i = 0; i < addresses.length; i += 100) {
          const batch = addresses
            .slice(i, i + 100)
            .map(address => address.address as Hex);

          const minBlockHeightInBatch = await getMinSynchedBlockForAddresses({
            addresses: batch,
            chainId,
            tokenId: 'eth',
          });

          // Get the minimum block height in the batch
          const fromBlock = bigIntMin([
            minBlockHeightInBatch,
            finalizedBlockNumber.number,
          ]);

          const toBlock = await getLatestBlockHeight(chainId);

          if (!toBlock) {
            // No blocks have been synced yet
            logger.info(`No blocks have been synced yet for chain ${chainId}`);
            continue;
          }

          if (fromBlock >= toBlock) {
            // Wait for the blocks to be synced
            logger.info(
              `No new blocks to sync for chain ${chainId} from ${fromBlock} to ${toBlock}`
            );
            continue;
          }

          await batchSyncNativeTransfers({
            addresses: batch,
            fromBlock,
            toBlock,
            chainId,
          });

          await updateAddressesSyncStatus({
            addresses: batch,
            chainId,
            tokenId: 'eth',
            blockNum: toBlock,
          });
        }
      })
    );

    await sleep(10000); // Sleep for 10 seconds
  }
};

export default syncNativeTransfers;
