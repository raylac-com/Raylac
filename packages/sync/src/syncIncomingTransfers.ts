import {
  bigIntMin,
  getPublicClient,
  getTraceId,
  traceFilter,
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
  upsertBlock,
  upsertTransaction,
} from './utils';
import logger from './lib/logger';

/**
 * Sync incoming native transfers for a batch of addresses
 */
const batchSyncIncomingNativeTransfers = async ({
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
  const traces = await traceFilter({
    fromBlock: toHex(fromBlock),
    toBlock: toHex(toBlock),
    toAddress: addresses,
    chainId,
  });
  console.timeEnd(`trace_filter ${chainId}`);

  for (const trace of traces) {
    if (trace.type === 'create') {
      // `type` can be either 'call' or 'create'.
      // Skip all 'create' traces.
      continue;
    }

    if (trace.action.value === '0x0') {
      // Skip all traces with a zero value
      continue;
    }

    await upsertBlock({
      blockNumber: BigInt(trace.blockNumber),
      blockHash: trace.blockHash,
      chainId,
    });

    await upsertTransaction({
      txHash: trace.transactionHash,
      blockHash: trace.blockHash,
      chainId,
    });

    const traceId = getTraceId({
      txHash: trace.transactionHash,
      traceAddress: trace.traceAddress,
    });

    const transferId = traceId;

    const data: Prisma.TransferCreateInput = {
      transferId,
      maxBlockNumber: trace.blockNumber,
    };

    const fromUser = await prisma.userStealthAddress.findUnique({
      select: {
        userId: true,
      },
      where: {
        address: getAddress(trace.action.from),
      },
    });

    const toUser = await prisma.userStealthAddress.findUnique({
      select: {
        userId: true,
      },
      where: {
        address: getAddress(trace.action.to),
      },
    });

    if (fromUser) {
      data.fromUser = {
        connect: {
          id: fromUser.userId,
        },
      };
    } else {
      data.fromAddress = getAddress(trace.action.from);
    }

    if (toUser) {
      data.toUser = {
        connect: {
          id: toUser.userId,
        },
      };
    } else {
      data.toAddress = getAddress(trace.action.to);
    }

    await prisma.transfer.upsert({
      create: data,
      update: data,
      where: {
        transferId,
      },
    });

    const traceUpsertArgs: Prisma.TraceCreateInput = {
      id: traceId,
      from: getAddress(trace.action.from),
      to: getAddress(trace.action.to),
      amount: BigInt(trace.action.value),
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

    await prisma.trace.upsert({
      create: traceUpsertArgs,
      update: traceUpsertArgs,
      where: {
        id: traceId,
      },
    });
  }
};

const syncIncomingNativeTransfers = async () => {
  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
      },
    });

    for (const chainId of supportedChains.map(chain => chain.id)) {
      const client = getPublicClient({ chainId });
      const finalizedBlockNumber = await client.getBlock({
        blockTag: 'finalized',
      });

      if (finalizedBlockNumber.number === null) {
        throw new Error('Finalized block number is null');
      }

      // Sync incoming transfers in 100 address batches
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

        if (fromBlock >= toBlock) {
          throw new Error(`fromBlock (${fromBlock}) >= toBlock (${toBlock})`);
        }

        await batchSyncIncomingNativeTransfers({
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
    }

    await sleep(10000); // Sleep for 10 seconds
  }
};

export default syncIncomingNativeTransfers;
