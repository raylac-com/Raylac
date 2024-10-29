import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  ENTRY_POINT_ADDRESS,
  getPublicClient,
  sleep,
  traceBlockByNumber,
} from '@raylac/shared';
import { BlockTransactionResponse } from '@raylac/shared/out/types';
import { Hex, hexToBigInt, isAddress, toBytes } from 'viem';
import prisma from './lib/prisma';
import { logger } from './utils';
import supportedChains from '@raylac/shared/out/supportedChains';

interface TraceWithTraceAddress extends BlockTransactionResponse {
  txHash: Hex;
  traceAddress: number[];
}

const IGNORE_CONTRACT_ADDRESSES = new Set(
  [
    '0x4200000000000000000000000000000000000006', // WETH
    ENTRY_POINT_ADDRESS,
    '0xCABEc88bB5319E22c536651aad46a5C544882002',
    '0xaFb2F11478f6FA61E625CCA136b6dA4FCd275D3c',
    '0x5E73c5cF9422d6A59BF544Dc524965634E21974A',
    '0xAd8eEBEdb5dAb3aba36fCB018eeC92c425362e31',
    '0x84b02B4ceE53c7d9E9243d9e39432cA75a951f8a',
    '0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8',
    '0x6591918516BdB44E618C33ef1c834238d489334E',
    '0xbbE50f03585F0E44aAC6Bd7cb174520DE72480aC',
    '0xbBce75170aa57B6828816B56Db5EA24A91BCaC9e',
    '0xE4310545E143b6E44Aefa9A96F9aca44984CB1e0',
    '0xc86c5857b448d1892540ce279B451343EbFab948',
    '0x1984c070e64e561631A7E20Ea3c4CbF4eb198Da8',
    '0x2b467997ed30316A3705AD9DA42C06c9a37285bc',
    '0x854D44777720969c18eDe7778d1F110C85438eaA',
    '0x2cE3fB4EA6A849Cc49F68BDBeaA4912A920bDFd8',
    '0x54af39EBAB5D1370B6a74A0cE3134ad06e0cCCbc',
    '0x4a25D28d10B02BCF13a16068F56d167D8F96d093',
    '0x91DfDeC28A8C2D946d151dF2fF9c8Dbd543d822E',
    '0xf70da97812CB96acDF810712Aa562db8dfA3dbEF',
    '0x65061d355ae0359Ec801E047e40c76051833E78c',
    '0x1FEAa0A9B9DC555963fBfC0B2EB68dA17A68989B',
    '0xd52b1994E745c0eE5Bc7AD41414Da7d9E0815b66',
    '0xB5ddDD1478cF09a531Ff4cfcBfC9C8b9dA93340d',
    '0x19cEeAd7105607Cd444F5ad10dd51356436095a1',
  ].map(address => address.toLowerCase())
);

/**
 * Get traces that all calls recursively.
 * (Filters out static calls, delegate calls, etc.)
 * - Assigns traceAddress to each call.
 */
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

const getBlockTraces = async ({
  chainId,
  blockNumber,
}: {
  chainId: number;
  blockNumber: bigint;
}) => {
  const traceBlockResult = await traceBlockByNumber({
    blockNumber,
    chainId,
  });

  const callsInBlock = traceBlockResult.flatMap(tx =>
    getCalls(tx.result, tx.txHash)
  );

  const callsWithValue = callsInBlock
    // Filter out calls with no value
    .filter(
      call =>
        call.value &&
        call.value !== '0x0' &&
        isAddress(call.to, {
          strict: false,
        }) &&
        isAddress(call.from, {
          strict: false,
        })
    )
    // Filter out calls to known contract addresses
    .filter(call => !IGNORE_CONTRACT_ADDRESSES.has(call.to?.toLowerCase()));

  //  console.time(`Saving ${callsWithValue.length} traces to db`);
  // Save all traces to the db

  const data = callsWithValue.map(call => ({
    from: Buffer.from(toBytes(call.from)),
    to: Buffer.from(toBytes(call.to)),
    amount: hexToBigInt(call.value).toString(),
    traceAddress: call.traceAddress.join('_'),
    chainId,
    transactionHash: call.txHash,
    blockNumber,
  }));

  return data;
};

const getLatestSynchedTrace = async (chainId: number) => {
  const latestTrace = await prisma.nativeTransferTrace.findFirst({
    select: {
      blockNumber: true,
    },
    where: {
      chainId,
    },
    orderBy: {
      blockNumber: 'desc',
    },
  });

  return latestTrace;
};

export const syncNativeTransfersForChain = async (chainId: number) => {
  try {
    const latestSyncedTrace = await getLatestSynchedTrace(chainId);

    let fromBlock: bigint;

    // We'd need to get traces from the account implementation deployed block anyways.
    // And we'd need to get traces from the latest synched block as well?

    // Maybe we just need to pay the compute units

    if (latestSyncedTrace) {
      fromBlock = latestSyncedTrace.blockNumber;
    } else {
      // eslint-disable-next-line security/detect-object-injection
      const accountImplDeployedBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

      if (accountImplDeployedBlock === undefined) {
        throw new Error(
          `Account implementation not deployed for chain ${chainId}`
        );
      }

      fromBlock = accountImplDeployedBlock;
    }

    const client = getPublicClient({ chainId });

    // Get the latest block number
    const toBlock = await client.getBlockNumber();

    logger.info(
      `Syncing traces in ${toBlock - fromBlock} blocks for chain ${chainId}`
    );

    const startTime = Date.now();
    const batchSize = 25n;
    for (let blockNumber = fromBlock; blockNumber <= toBlock; ) {
      const tracePromises = [];

      for (let i = 0; i < batchSize; i++) {
        tracePromises.push(
          getBlockTraces({
            blockNumber: blockNumber + BigInt(i),
            chainId,
          })
        );
      }

      try {
        const startTime = Date.now();
        const traces = await Promise.all(tracePromises);

        const startWriteTime = Date.now();
        await prisma.nativeTransferTrace.createMany({
          data: traces.flat(),
          skipDuplicates: true,
        });
        const endWriteTime = Date.now();

        logger.info(
          `Wrote ${traces.flat().length} traces to db in ${endWriteTime - startWriteTime}ms`
        );

        const endTime = Date.now();
        const bps = (
          Number(batchSize) /
          ((endTime - startTime) / 1000)
        ).toFixed(2);
        logger.info(
          `Synced ${batchSize} blocks in ${endTime - startTime}ms for chain ${chainId} (${bps} bps)`
        );

        blockNumber += batchSize;
      } catch (error) {
        logger.error(
          `Error syncing traces for block ${blockNumber} on chain ${chainId}: ${error}`
        );

        logger.info(`Retrying from block ${blockNumber}`);
      }
    }

    const endTime = Date.now();
    logger.info(
      `Synced traces for ${toBlock - fromBlock} blocks in ${endTime - startTime}ms for chain ${chainId}`
    );
  } catch (error) {
    logger.error(`Error syncing traces for chain ${chainId}: ${error}`);

    logger.info(`Retrying in 5 seconds`);

    await sleep(5000);
  }
};

const syncAllNativeTransfers = async () => {
  while (true) {
    const chainSyncJobs = [];
    for (const chain of supportedChains) {
      chainSyncJobs.push(syncNativeTransfersForChain(chain.id));
    }

    await Promise.all(chainSyncJobs);

    await sleep(3000);
  }
};

export default syncAllNativeTransfers;
