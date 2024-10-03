import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  bigIntMin,
  getPublicClient,
  RaylacAccountTransferData,
  traceFilter,
  traceToPostgresRecord,
} from '@raylac/shared';
import { Hex, toHex } from 'viem';
import prisma from './lib/prisma';
import { $Enums } from '@prisma/client';
import supportedChains from '@raylac/shared/out/supportedChains';
import { sleep } from './lib/utils';
import { getLatestBlockHeight } from './utils';

/**
 * Sync all calls made to the `execute` function in RaylacAccount.sol
 * for a given address.
 */
const syncTransfersForAddresses = async ({
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
  const traces = await traceFilter({
    fromBlock: toHex(fromBlock),
    toBlock: toHex(toBlock),
    toAddress: addresses,
    chainId,
  });
  console.timeEnd(`trace_filter ${chainId}`);

  const callTracesWithValue = traces
    // Get the `type: call` traces
    .filter(trace => trace.type === 'call')
    // Get the traces with a non-zero value
    .filter(trace => trace.action.value !== '0x0');

  if (callTracesWithValue.length !== 0) {
    console.log(
      `Found ${callTracesWithValue.length} incoming transfers for ${addresses.length} addresses on chain ${chainId}`
    );
  }

  const decodedTraces = callTracesWithValue.map(trace => {
    const transferData: RaylacAccountTransferData = {
      type: $Enums.ExecutionType.Transfer,
      to: trace.action.to,
      amount: BigInt(trace.action.value),
      tokenId: 'eth',
      tag: '',
    };

    return traceToPostgresRecord({
      transferData,
      traceTxHash: trace.transactionHash,
      traceTxPosition: trace.transactionPosition,
      traceAddress: trace.traceAddress,
      fromAddress: trace.action.from,
      chainId,
    });
  });

  const txHashes = [...new Set(decodedTraces.map(trace => trace.txHash))];

  // TODO: Use Promise.all
  for (const txHash of txHashes) {
    const trace = traces.find(trace => trace.transactionHash === txHash);

    if (!trace) {
      throw new Error(`Trace not found for transaction ${txHash}`);
    }

    await prisma.transaction.upsert({
      create: {
        hash: txHash,
        chainId,
        block: {
          connectOrCreate: {
            create: {
              number: trace.blockNumber,
              hash: trace.blockHash,
              chainId,
            },
            where: {
              hash: trace.blockHash,
            },
          },
        },
      },
      update: {},
      where: {
        hash: txHash,
      },
    });
  }

  await prisma.transferTrace.createMany({
    data: decodedTraces,
    skipDuplicates: true,
  });
};

const getAddressesSyncStatus = async ({
  addresses,
  chainId,
}: {
  addresses: Hex[];
  chainId: number;
}) => {
  const traceSyncStatus = await prisma.traceSyncStatus.findMany({
    select: {
      address: true,
      lastSyncedBlockNum: true,
    },
    where: {
      address: {
        in: addresses,
      },
      chainId,
    },
  });

  // eslint-disable-next-line security/detect-object-injection
  const defaultFromBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

  if (!defaultFromBlock) {
    throw new Error(`No default from block for chain ${chainId}`);
  }

  return addresses.map(
    address =>
      traceSyncStatus.find(status => status.address === address) || {
        // If the address is not found in the sync status table, return a default object
        address,
        lastSyncedBlockNum: defaultFromBlock,
      }
  );
};

const syncIncomingTransfers = async () => {
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

        const addressesWithSyncStatus = await getAddressesSyncStatus({
          addresses: batch,
          chainId,
        });

        // Get the minimum block height in the batch
        const minBlockHeightInBatch = addressesWithSyncStatus.sort((a, b) =>
          a.lastSyncedBlockNum > b.lastSyncedBlockNum ? 1 : -1
        )[0].lastSyncedBlockNum;

        const fromBlock = bigIntMin([
          minBlockHeightInBatch,
          finalizedBlockNumber.number,
        ]);

        const toBlock = await getLatestBlockHeight(chainId);

        if (fromBlock >= toBlock) {
          throw new Error(`fromBlock (${fromBlock}) >= toBlock (${toBlock})`);
        }

        await syncTransfersForAddresses({
          addresses: batch,
          fromBlock,
          toBlock,
          chainId,
        });

        // Update the last synced block number for the addresses
        const createSyncStatusRecords = addressesWithSyncStatus.filter(
          address =>
            address.lastSyncedBlockNum ===
            // eslint-disable-next-line security/detect-object-injection
            ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId]
        );

        const updateSyncStatusRecords = addressesWithSyncStatus.filter(
          address =>
            address.lastSyncedBlockNum !==
            // eslint-disable-next-line security/detect-object-injection
            ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId]
        );

        await prisma.traceSyncStatus.createMany({
          data: createSyncStatusRecords.map(address => ({
            address: address.address,
            chainId,
            lastSyncedBlockNum: toBlock,
          })),
          skipDuplicates: true,
        });

        await prisma.traceSyncStatus.updateMany({
          data: {
            lastSyncedBlockNum: toBlock,
          },
          where: {
            address: {
              in: updateSyncStatusRecords.map(address => address.address),
            },
            chainId,
          },
        });
      }
    }

    await sleep(10000); // Sleep for 10 seconds
  }
};

export default syncIncomingTransfers;
