import {
  bigIntMin,
  devChains,
  getChainName,
  getNativeTransferTracesInBlock,
  getPublicClient,
  sleep,
  traceFilter,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { getAddress, Hex, hexToBigInt, toHex } from 'viem';
import { Prisma } from '@raylac/db';
import {
  getBlockTimestamp,
  updateAddressesSyncStatus,
  upsertTransaction,
  waitForAnnouncementsBackfill,
} from './utils';
import { base, optimism } from 'viem/chains';
import { getTokenPriceAtTime } from './lib/coingecko';
import { logger } from '@raylac/shared-backend';
const syncNativeTransfersWithTraceBlock = async (chainId: number) => {
  const addressSyncStatuses = await prisma.addressSyncStatus.findMany({
    select: {
      blockNumber: true,
      chainId: true,
      address: true,
    },
    where: {
      chainId,
      tokenId: 'eth',
    },
    orderBy: {
      blockNumber: 'asc',
    },
  });

  console.log({ addressSyncStatuses });

  if (addressSyncStatuses.length === 0) {
    return;
  }

  const fromBlock = addressSyncStatuses[0].blockNumber;

  const client = getPublicClient({ chainId });

  const toBlock = await client.getBlockNumber();

  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    // Get addresses that needs to be scanned from this block
    const addresses = addressSyncStatuses.filter(
      addressSyncStatus => BigInt(addressSyncStatus.blockNumber) <= blockNumber
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

    const devChainIds = devChains.map(c => c.id);
    const isDevChain = devChainIds.includes(chainId);

    // Update on every block on dev chains
    // On other chains, update every 10 blocks
    if (isDevChain || Number(blockNumber) % 10 === 0) {
      await updateAddressesSyncStatus({
        addresses: addresses.map(address => address.address as Hex),
        chainId,
        tokenId: 'eth',
        blockNumber,
      });
    }
  }
};

const syncNativeTransfersWithTraceFilter = async (chainId: number) => {
  if (chainId !== base.id && chainId !== optimism.id) {
    throw new Error(`Cannot use trace_filter for ${getChainName(chainId)}`);
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

      const incomingTraces = await traceFilter({
        fromBlock: toHex(fromBlock),
        toBlock: toHex(toBlock),
        toAddress: addressesToSync,
        chainId,
      });

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
          blockHash: trace.blockHash,
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

const syncNativeTransfersForChain = async (chainId: number) => {
  if (chainId === base.id || chainId === optimism.id) {
    await syncNativeTransfersWithTraceFilter(chainId);
  } else {
    await syncNativeTransfersWithTraceBlock(chainId);
  }
};

const syncNativeTransfers = async ({
  announcementChainId,
  chainIds,
}: {
  announcementChainId: number;
  chainIds: number[];
}) => {
  logger.info(
    'syncNativeTransfers: Waiting for announcements backfill to complete'
  );

  // We want to wait for announcements backfill to complete before start indexing native transfers,
  // because synching in batches of addresses is a lot faster than indexing address transfers one by one.
  await waitForAnnouncementsBackfill({ announcementChainId });
  logger.info(`syncNativeTransfers: Announcements backfill complete`);

  while (true) {
    try {
      const promises = [];

      for (const chainId of chainIds) {
        promises.push(syncNativeTransfersForChain(chainId));
      }

      await Promise.all(promises);
    } catch (err) {
      logger.error(err);
    }

    await sleep(3 * 1000);
  }
};

export default syncNativeTransfers;
