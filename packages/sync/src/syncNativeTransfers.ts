import {
  bigIntMin,
  getNativeTransferTracesInBlock,
  getPublicClient,
  sleep,
  traceFilter,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { getAddress, Hex, hexToBigInt, toHex } from 'viem';
import { Prisma } from '@prisma/client';
import {
  logger,
  updateAddressesSyncStatus,
  upsertTransaction,
  waitForAnnouncementsBackfill,
} from './utils';
import supportedChains from '@raylac/shared/out/supportedChains';
import { base, optimism } from 'viem/chains';
import { getTokenPriceAtTime } from './lib/coingecko';

const syncNativeTransfersForChain = async (chainId: number) => {
  const addressSyncStatuses = await prisma.addressSyncStatus.findMany({
    select: {
      blockNumber: true,
      chainId: true,
      address: true,
    },
    where: {
      chainId,
    },
    orderBy: {
      blockNumber: 'asc',
    },
  });

  if (addressSyncStatuses.length === 0) {
    return;
  }

  const fromBlock = addressSyncStatuses[0].blockNumber;

  const client = getPublicClient({ chainId });

  const toBlock = await client.getBlockNumber();

  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    // Get addresses that needs to be scanned from this block
    const addresses = addressSyncStatuses.filter(
      addressSyncStatus => addressSyncStatus.blockNumber < blockNumber
    );

    logger.info(
      `Scanning blocks for ${addresses.length} addresses in block ${blockNumber} on chain ${chainId}`
    );

    const callsWithValue = await getNativeTransferTracesInBlock({
      blockNumber,
      chainId,
    });

    const callsWithAddresses = callsWithValue.filter(call => {
      const to = getAddress(call.to);
      const from = getAddress(call.from);

      return (
        addresses.some(address => address.address === to) ||
        addresses.some(address => address.address === from)
      );
    });

    if (callsWithAddresses.length > 0) {
      logger.info(
        `Found ${callsWithAddresses.length} calls with announced address in block ${blockNumber}`
      );
    }

    const txHashes = new Set(callsWithAddresses.map(call => call.txHash));

    await Promise.all(
      [...txHashes].map(txHash => upsertTransaction({ txHash, chainId }))
    );

    const data: Prisma.TraceCreateManyInput[] = callsWithAddresses.map(
      call => ({
        from: getAddress(call.from),
        to: getAddress(call.to),
        amount: hexToBigInt(call.value).toString(),
        traceAddress: call.traceAddress.join('_'),
        transactionHash: call.txHash,
        chainId,
        tokenId: 'eth',
      })
    );

    if (data.length > 0) {
      // Save matching traces to db
      await prisma.trace.createMany({
        data,
        skipDuplicates: true,
      });
    }

    // Only update every 10 blocks
    if (Number(blockNumber) % 10 === 0) {
      await updateAddressesSyncStatus({
        addresses: addresses.map(address => address.address as Hex),
        chainId,
        tokenId: 'eth',
        blockNumber,
      });
    }
  }
};

const getBlockTimestamp = async ({
  chainId,
  blockNumber,
}: {
  chainId: number;
  blockNumber: bigint;
}) => {
  const client = getPublicClient({ chainId });
  const block = await client.getBlock({ blockNumber });

  if (!block) {
    throw new Error(`Block ${blockNumber} not found for chain ${chainId}`);
  }

  return block.timestamp;
};

const syncNativeTransfersWithTraceFilter = async (chainId: number) => {
  if (chainId !== base.id && chainId !== optimism.id) {
    throw new Error(`Cannot use trace_filter for chain ${chainId}`);
  }

  const addressWithSyncStatus = await prisma.addressSyncStatus.findMany({
    select: {
      address: true,
      blockNumber: true,
    },
    where: {
      chainId,
      tokenId: 'eth',
    },
    orderBy: {
      blockNumber: 'asc',
    },
  });

  logger.info(
    `Syncing native transfers for ${addressWithSyncStatus.length} addresses`
  );

  const addressBatchSize = 100;
  const blockBatchSize = 100000n;

  const client = getPublicClient({ chainId });

  for (let i = 0; i < addressWithSyncStatus.length; i += addressBatchSize) {
    const batch = addressWithSyncStatus.slice(i, i + addressBatchSize);
    const fromBlock = batch[0].blockNumber;

    const latestBlockNumber = await client.getBlockNumber();

    for (
      let blockNumber = fromBlock;
      blockNumber <= latestBlockNumber;
      blockNumber += blockBatchSize
    ) {
      const toBlock = bigIntMin([
        blockNumber + blockBatchSize,
        latestBlockNumber,
      ]);

      const addressesToSync = batch
        .filter(address => address.blockNumber < toBlock)
        .map(address => address.address as Hex);

      if (addressesToSync.length === 0) {
        continue;
      }

      console.time(`traceFilter for ${addressesToSync.length} addresses`);
      const incomingTraces = await traceFilter({
        fromBlock: toHex(fromBlock),
        toBlock: toHex(toBlock),
        toAddress: addressesToSync,
        chainId,
      });
      console.timeEnd(`traceFilter for ${addressesToSync.length} addresses`);

      const outgoingTraces = await traceFilter({
        fromBlock: toHex(fromBlock),
        toBlock: toHex(toBlock),
        fromAddress: addressesToSync,
        chainId,
      });

      const traces = [...incomingTraces, ...outgoingTraces];

      const tracesToSave = traces
        .filter(trace => trace.type !== 'create')
        .filter(trace => trace.action.callType === 'call')
        .filter(trace => trace.action.value !== '0x0');

      const txHashes = new Set(
        tracesToSave.map(trace => trace.transactionHash)
      );

      await Promise.all(
        [...txHashes].map(txHash => upsertTransaction({ txHash, chainId }))
      );

      const data: Prisma.TraceCreateManyInput[] = [];
      for (const trace of tracesToSave) {
        const blockTimestamp = await getBlockTimestamp({
          chainId,
          blockNumber: BigInt(trace.blockNumber),
        });

        const tokenPrice = blockTimestamp
          ? await getTokenPriceAtTime('eth', Number(blockTimestamp))
          : undefined;

        data.push({
          from: getAddress(trace.action.from),
          to: getAddress(trace.action.to),
          amount: hexToBigInt(trace.action.value).toString(),
          traceAddress: trace.traceAddress.join('_'),
          transactionHash: trace.transactionHash,
          tokenPriceAtTrace: tokenPrice || null,
          chainId,
          tokenId: 'eth',
        });
      }

      if (data.length > 0) {
        await prisma.trace.createMany({
          data,
          skipDuplicates: true,
        });
      }

      await updateAddressesSyncStatus({
        addresses: addressesToSync,
        chainId,
        tokenId: 'eth',
        blockNumber: toBlock,
      });
    }
  }
};

const syncNativeTransfers = async () => {
  logger.info(
    'syncNativeTransfers: Waiting for announcements backfill to complete'
  );
  await waitForAnnouncementsBackfill();
  logger.info(`syncNativeTransfers: Announcements backfill complete`);

  while (true) {
    try {
      const promises = [];

      for (const chain of supportedChains) {
        if (chain.id === base.id || chain.id === optimism.id) {
          promises.push(syncNativeTransfersWithTraceFilter(chain.id));
        } else {
          promises.push(syncNativeTransfersForChain(chain.id));
        }
      }

      await Promise.all(promises);
    } catch (err) {
      logger.error(err);
    }

    await sleep(3 * 1000);
  }
};

export default syncNativeTransfers;