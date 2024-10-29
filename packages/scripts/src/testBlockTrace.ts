import 'dotenv/config';
import { getPublicClient, traceBlockByNumber } from '@raylac/shared';
import supportedChains from '@raylac/shared/out/supportedChains';
import { BlockTransactionResponse } from '@raylac/shared/out/types';
import { Hex } from 'viem';
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
    return tx.calls
      .filter(call => call.type === 'CALL')
      .flatMap((call, index) =>
        getCalls(call, txHash, [...traceAddress, index])
      );
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
  for (const chain of [base]) {
    const client = getPublicClient({ chainId: chain.id });

    const block = await client.getBlock({
      blockTag: 'finalized',
      includeTransactions: true,
    });

    console.time(`Tracing ${chain.name} block ${block.number}`);
    const txs = await traceBlockByNumber({
      blockNumber: block.number,
      chainId: chain.id,
    });

    console.log(txs);

    console.timeEnd(`Tracing ${chain.name} block ${block.number}`);
  }
};

testBlockTrace();
