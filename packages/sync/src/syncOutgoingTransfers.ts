import {
  ENTRY_POINT_ADDRESS,
  ERC20Abi,
  RaylacAccountAbi,
  RaylacAccountTransferData,
  traceTransaction,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { decodeFunctionData, getAddress, Hex } from 'viem';
import { $Enums, Prisma } from '@prisma/client';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { sleep } from './lib/utils';

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
 * Decode the `data` field of the `execute` function in RaylacAccount.sol as a token transfer.
 * If the `to` field of the call is an ERC20 token, decode the `data` field as an ERC20 transfer.
 * Otherwise, decode the `data` field as an ETH transfer.
 */
const decodeExecuteAsTransfer = ({
  executeArgs,
  chainId,
}: {
  executeArgs: {
    to: Hex;
    value: bigint;
    data: Hex;
    tag: Hex;
  };
  chainId: number;
}): RaylacAccountTransferData | null => {
  // Check if the `to` field of the call is an ERC20 token
  const erc20TokenData = supportedTokens.find(token =>
    token.addresses.find(
      address =>
        address.chain.id === chainId && address.address === executeArgs.to
    )
  );

  const tag = executeArgs.tag;

  if (erc20TokenData) {
    // This is a call to an ERC20 token

    // Decode the data field of the call
    const decodedData = decodeFunctionData({
      abi: ERC20Abi,
      data: executeArgs.data,
    });

    if (decodedData.functionName === 'transfer') {
      return {
        type: $Enums.ExecutionType.Transfer,
        to: decodedData.args[0],
        amount: BigInt(decodedData.args[1]),
        tokenId: erc20TokenData.tokenId,
        tag,
      };
    } else {
      return null;
    }
  } else if (executeArgs.data === '0x') {
    return {
      type: $Enums.ExecutionType.Transfer,
      to: executeArgs.to,
      amount: executeArgs.value,
      tokenId: 'eth',
      tag,
    };
  } else {
    return {
      type: $Enums.ExecutionType.BridgeTransfer,
      to: executeArgs.to,
      amount: executeArgs.value,
      tokenId: 'eth',
      tag,
    };
  }
};

const syncOutgoingTransfers = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const txHashes = await prisma.transaction.findMany({
      select: {
        hash: true,
        chainId: true,
      },
      where: {
        synchedTraces: false,
      },
    });

    for (const { hash, chainId } of txHashes) {
      const traces = await traceTransaction({
        txHash: hash as Hex,
        chainId,
      });

      const callsFromEntryPoint = traces
        // Get the `type: call` traces
        .filter(trace => trace.type === 'call')
        // Get the traces that are possibly function calls (i.e., the `input` field is not `0x`)
        .filter(trace => trace.action.input !== '0x')
        .filter(trace => trace.action.callType === 'call')
        .filter(
          trace => trace.action.from === ENTRY_POINT_ADDRESS.toLowerCase()
        );

      const decodedTraces = callsFromEntryPoint
        .map(trace => {
          try {
            // Decode the `input` field of the trace
            const decoded = decodeFunctionData({
              abi: RaylacAccountAbi,
              data: trace.action.input,
            });
            return {
              trace,
              decoded,
            };
          } catch (err) {
            return null;
          }
        })

        // Only keep the traces that are calls to the `execute` function
        .filter(
          data => data !== null && data.decoded.functionName === 'execute'
        )
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
            traceAddress: [...trace.traceAddress, 0, 0],
            // The trace is a call to the `execute` function, so the `from` address of a transfer is the `to` address that's being called.
            fromAddress: trace.action.to,
            blockNumber: BigInt(trace.blockNumber),
            chainId,
          });
        })
        .filter(data => data !== null);

      console.log(
        `Found ${decodedTraces.length} "execute" traces for transaction ${hash}`
      );

      await prisma.transferTrace.createMany({
        data: decodedTraces,
        skipDuplicates: true,
      });

      // Mark the transaction as synched
      await prisma.transaction.update({
        where: {
          hash,
        },
        data: {
          synchedTraces: true,
        },
      });
    }

    await sleep(10000); // Sleep for 10 seconds
  }
};

export default syncOutgoingTransfers;
