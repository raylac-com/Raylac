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
 * Sync all traces where the `execute` function of the address is called.
 */
/*
const syncOutgoingTransfers = async (address: Hex) => {
  // TODO: Don't sync if the account contract is not deployed yet

  for (const chainId of supportedChains.map(chain => chain.id)) {
    const traces = await traceFilter({
      fromBlock: toHex(ACCOUNT_IMPL_DEPLOYED_BLOCK),
      toAddress: address,
      chainId,
    });

    const callTraces = traces
      // Get the `type: call` traces
      .filter(trace => trace.type === 'call')
      // Get the traces that are possibly function calls
      .filter(trace => trace.action.input !== '0x');

    const decodedTraces = callTraces
      .map(trace => {
        try {
          // Decode the `data` field of the trace
          const decoded = decodeFunctionData({
            abi: RaylacAccountAbi,
            data: trace.action.input,
          });
          return {
            trace,
            decoded,
          };
        } catch (err) {
          console.error(`Error decoding data: ${err}`);
          return null;
        }
      })

      // Only keep the traces that are calls to the `execute` function
      .filter(data => data !== null && data.decoded.functionName === 'execute')
      .map(data => {
        const trace = data!.trace;

        // Decode the arguments of the `execute` function
        // as a transfer.
        const transferData = decodeExecuteAsTransfer({
          executeArgs: {
            to: data?.decoded.args[0] as Hex,
            value: BigInt(data?.decoded.args[1] as string),
            data: data?.decoded.args[2] as Hex,
            tag: data?.decoded.args[3] as Hex,
          },
          chainId,
        });

        if (!transferData) {
          return null;
        }

        return traceToPostgresRecord({
          transferData,
          traceTxHash: trace.transactionHash,
          traceTxPosition: trace.transactionPosition,
          traceAddress: trace.traceAddress,
          fromAddress: address,
          blockNumber: BigInt(trace.blockNumber),
          chainId,
        });
      })
      .filter(data => data !== null);

    // Create the `Transaction` records firs
    const txHashes = [...new Set(decodedTraces.map(trace => trace.txHash))];

    await prisma.transaction.createMany({
      data: txHashes.map(txHash => ({ hash: txHash })),
      skipDuplicates: true,
    });

    await prisma.transferTrace.createMany({
      data: decodedTraces,
      skipDuplicates: true,
    });
  }
};
*/

const syncIncomingTransfers = async (address: Hex) => {
  // Get the latest synched traces for the address
  const latestTrace = await prisma.transferTrace.findFirst({
    where: { to: address },
    orderBy: { blockNumber: 'desc' },
  });

  const syncFromBlock = latestTrace
    ? BigInt(latestTrace.blockNumber) + BigInt(1)
    : BigInt(ACCOUNT_IMPL_DEPLOYED_BLOCK);

  // const syncFromBlock = BigInt(ACCOUNT_IMPL_DEPLOYED_BLOCK);

  for (const chainId of supportedChains.map(chain => chain.id)) {
    const traces = await traceFilter({
      fromBlock: toHex(syncFromBlock),
      toAddress: address,
      chainId,
    });

    const callTracesWithValue = traces
      // Get the `type: call` traces
      .filter(trace => trace.type === 'call')
      // Get the traces with a non-zero value
      .filter(trace => trace.action.value !== '0x');

    const decodedTraces = callTracesWithValue.map(trace => {
      const transferData: RaylacAccountTransferData = {
        type: $Enums.ExecutionType.Transfer,
        to: address,
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

/**
 * Sync all calls made to the `execute` function in RaylacAccount.sol
 * for a given address.
 */
const syncTransfersForAddress = async (address: Hex) => {
  // await syncOutgoingTransfers(address);
  await syncIncomingTransfers(address);
};

const syncTransfers = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: { address: true },
    });

    for (const { address } of addresses) {
      console.log(`Syncing transfers for ${address}`);
      await syncTransfersForAddress(address as Hex);
    }

    await sleep(10000); // 10 seconds
  }
};

export default syncTransfers;
