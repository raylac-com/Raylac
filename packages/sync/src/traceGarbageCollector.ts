import supportedChains from '@raylac/shared/out/supportedChains';
import prisma from './lib/prisma';
import { getPublicClient, sleep } from '@raylac/shared';
import { getApproxChainBlockTime } from './utils';

const SCAN_PAST_BUFFER_SECS = 60 * 60; // 1 hour

const garbageCollectForChain = async (chainId: number) => {
  const client = getPublicClient({ chainId });

  const oldestScannedUserStealthAddress =
    await prisma.addressSyncStatus.findFirst({
      orderBy: {
        lastSyncedBlockNum: 'asc',
      },
      where: {
        tokenId: 'eth',
        chainId,
      },
    });

  if (!oldestScannedUserStealthAddress) {
    // No user stealth addresses have been scanned yet,
    // so no traces to garbage collect
    return;
  }

  const chainBlockTime = await getApproxChainBlockTime(chainId);

  const finalizedBlock = await client.getBlock({
    blockTag: 'finalized',
  });

  const deleteTracesBeforeBlock =
    Number(finalizedBlock.number) -
    Math.floor(SCAN_PAST_BUFFER_SECS / chainBlockTime);

  await prisma.trace.deleteMany({
    where: {
      fromStealthAddress: null,
      toStealthAddress: null,
      Transaction: {
        block: {
          chainId,
          number: {
            lt: deleteTracesBeforeBlock,
          },
        },
      },
    },
  });
};

const traceGarbageCollector = async () => {
  // Delete traces before the oldest scanned user stealth address minus buffer
  // These traces should be assigned to a user stealth address if a user stealth address has been announced and synced

  while (true) {
    const garbageCollectionJobs = [];

    for (const chain of supportedChains) {
      garbageCollectionJobs.push(garbageCollectForChain(chain.id));
    }

    await Promise.all(garbageCollectionJobs);

    await sleep(60 * 1000);
  }
};

export default traceGarbageCollector;
