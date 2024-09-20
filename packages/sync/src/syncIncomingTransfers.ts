import { RaylacAccountTransferData, traceFilter } from '@raylac/shared';
import { getAddress, Hex, toHex } from 'viem';
import prisma from './lib/prisma';
import { $Enums, Prisma } from '@prisma/client';
import supportedChains from '@raylac/shared/out/supportedChains';
import { sleep } from './lib/utils';

const ACCOUNT_IMPL_DEPLOYED_BLOCK = 15099210;

/**
 * Convert a decoded trace to a `TransferTrace` record in the Postgres database.
 */
const traceToPostgresRecord = ({
  transferData,
  traceTxHash,
  traceTxPosition,
  traceAddress,
  blockNumber,
  fromAddress,
  chainId,
}: {
  transferData: RaylacAccountTransferData;
  traceTxHash: Hex;
  traceTxPosition: number;
  traceAddress: number[];
  blockNumber: bigint;
  fromAddress: Hex;
  chainId: number;
}): Prisma.TransferTraceCreateManyInput => {
  const to = transferData.to;
  const amount = transferData.amount;

  return {
    from: getAddress(fromAddress),
    to: getAddress(to),
    amount,
    tokenId: transferData.tokenId,
    blockNumber,
    txHash: traceTxHash,
    txPosition: traceTxPosition,
    traceAddress: traceAddress.join('_'),
    executionType: transferData.type,
    executionTag: transferData.tag,
    chainId,
  };
};

/**
 * Sync all calls made to the `execute` function in RaylacAccount.sol
 * for a given address.
 */
const syncTransfersForAddresses = async (addresses: Hex[]) => {
  // Get the latest synched traces for the address
  /*
  const latestTrace = await prisma.transferTrace.findFirst({
    where: { to: address },
    orderBy: { blockNumber: 'desc' },
  });

  const syncFromBlock = latestTrace
    ? BigInt(latestTrace.blockNumber) + BigInt(1)
    : BigInt(ACCOUNT_IMPL_DEPLOYED_BLOCK);
  */

  const syncFromBlock = BigInt(ACCOUNT_IMPL_DEPLOYED_BLOCK);

  for (const chainId of supportedChains.map(chain => chain.id)) {
    const traces = await traceFilter({
      fromBlock: toHex(syncFromBlock),
      toAddress: addresses,
      chainId,
    });

    const callTracesWithValue = traces
      // Get the `type: call` traces
      .filter(trace => trace.type === 'call')
      // Get the traces with a non-zero value
      .filter(trace => trace.action.value !== '0x0');

    console.log(
      `Found ${callTracesWithValue.length} incoming transfers for ${addresses.length} addresses on chain ${chainId}`
    );

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
        blockNumber: BigInt(trace.blockNumber),
        chainId,
      });
    });

    // Create the `Transaction` records firs
    const txHashes = [...new Set(decodedTraces.map(trace => trace.txHash))];

    await prisma.transaction.createMany({
      data: txHashes.map(txHash => ({
        hash: txHash,
        blockNumber: BigInt(
          traces.find(trace => trace.transactionHash === txHash)!.blockNumber
        ),
        chainId,
      })),
      skipDuplicates: true,
    });

    await prisma.transferTrace.createMany({
      data: decodedTraces,
      skipDuplicates: true,
    });
  }
};

const syncIncomingTransfers = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: { address: true },
    });

    // Sync incoming transfers in 100 address batches
    for (let i = 0; i < addresses.length; i += 100) {
      const batch = addresses
        .slice(i, i + 100)
        .map(({ address }) => address as Hex);

      await syncTransfersForAddresses(batch);
    }

    await sleep(10000); // Sleep for 10 seconds
  }
};

export default syncIncomingTransfers;
