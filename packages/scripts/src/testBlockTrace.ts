import 'dotenv/config';
import fs from 'fs';
import {
  getNativeTransferTracesInBlock,
  getPublicClient,
  traceBlockByNumber,
  traceFilter,
} from '@raylac/shared';
import supportedChains from '@raylac/shared/out/supportedChains';
import { BlockTransactionResponse } from '@raylac/shared/out/types';
import { Hex, toHex } from 'viem';
import { base, scroll, arbitrum, optimism, polygon, zksync } from 'viem/chains';

interface TraceWithTraceAddress extends BlockTransactionResponse {
  txHash: Hex;
  traceAddress: number[];
}

const getCalls = (
  tx: BlockTransactionResponse,
  txHash: Hex,
  traceAddress: number[] = []
): TraceWithTraceAddress[] => {
  if (tx.calls) {
    return [
      { ...tx, txHash, traceAddress },
      ...tx.calls.flatMap((call, index) =>
        getCalls(call, txHash, [...traceAddress, index])
      ),
    ];
  }

  return [{ ...tx, txHash, traceAddress }];
};

const getApproxBlockTime = async (chainId: number): Promise<number> => {
  const client = getPublicClient({ chainId });
  const latestBlock = await client.getBlock({
    blockTag: 'latest',
  });

  const compareBlock = await client.getBlock({
    blockNumber: latestBlock.number - 10n,
  });

  const timeDiff = latestBlock.timestamp - compareBlock.timestamp;

  return Number(timeDiff) / 10;
};

const testBlockTrace = async () => {
  const client = getPublicClient({ chainId: base.id });

  const block = await client.getBlock({
    blockTag: 'finalized',
    includeTransactions: true,
  });

  const traceBlockResult = await getNativeTransferTracesInBlock({
    blockNumber: 21827703n,
    chainId: base.id,
  });

  const tx = traceBlockResult.filter(
    tx =>
      tx.txHash ===
      '0x1738433b36de2d1b0f134c180f672820832317fbd619b4b47636093968078ff4'
  );

  console.log(tx);
};

testBlockTrace();
