import { bigIntMin, getPublicClient, traceFilter } from '@raylac/shared';
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
  console.log(`tracing from ${fromBlock} to ${toBlock} on chain ${chainId}`);
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

    const data: Prisma.TransferTraceCreateInput = {
      from: getAddress(trace.action.from),
      to: getAddress(trace.action.to),
      amount: BigInt(trace.action.value),
      tokenId: 'eth',
      Transaction: {
        connect: {
          hash: trace.transactionHash,
        },
      },
      txPosition: trace.transactionPosition,
      traceAddress: trace.traceAddress.join('_'),
      executionType: 'Transfer',
      executionTag: '',
      chainId,
    };

    await prisma.transferTrace.upsert({
      create: data,
      update: data,
      where: {
        txHash_traceAddress: {
          txHash: trace.transactionHash,
          traceAddress: trace.traceAddress.join('_'),
        },
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
