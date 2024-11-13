import { Prisma } from '@raylac/db';
import prisma from './lib/prisma';
import { Hex } from 'viem';
import {
  bigIntMax,
  decodeUserOperationContext,
  devChains,
  sleep,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';

/**
 * Get all transactions that haven't been assigned to a `UserAction` yet
 */
const getUnassignedTxs = async ({ chainIds }: { chainIds: number[] }) => {
  const unassignedTxs = await prisma.transaction.findMany({
    select: {
      chainId: true,
      hash: true,
      block: {
        select: {
          timestamp: true,
        },
      },
      tag: true,
    },
    where: {
      userActionId: null,
      chainId: {
        in: chainIds,
      },
    },
  });

  return unassignedTxs;
};

const syncMultiChainTransfers = async ({
  chainIds,
}: {
  chainIds: number[];
}) => {
  while (true) {
    const unassignedTxs = await getUnassignedTxs({ chainIds });

    // Decode all transactions
    const decodedTxs = unassignedTxs.map(tx => {
      const { multiChainTag, numChains } = decodeUserOperationContext({
        txHash: tx.hash as Hex,
        context: tx.tag as Hex,
      });

      if (devChains.map(chain => chain.id).includes(tx.chainId)) {
        console.log({ multiChainTag, numChains, tag: tx.tag, hash: tx.hash });
      }

      return { ...tx, multiChainTag, numChains };
    });

    // Get all unique multi chain tags
    const multiChainTags = new Set(decodedTxs.map(tx => tx.multiChainTag));

    for (const multiChainTag of multiChainTags) {
      // Find other transactions with the same multi chain tag
      const txsInGroup = decodedTxs.filter(
        tx => tx.multiChainTag === multiChainTag
      );
      const numChains = txsInGroup[0].numChains;

      if (txsInGroup.length !== numChains) {
        logger.info(
          `Waiting for ${numChains} transactions in group ${multiChainTag}`
        );
        continue;
      }

      const txHashes = txsInGroup.map(tx => tx.hash).sort();

      // Create a new UserAction for the group
      const data: Prisma.UserActionCreateInput = {
        groupTag: multiChainTag,
        groupSize: numChains,
        transactions: {
          connect: txHashes.map(hash => ({ hash })),
        },
        txHashes,
        // Use the timestamp of the latest transaction as the timestamp of the UserAction
        timestamp: bigIntMax(
          txsInGroup.map(tx => BigInt(tx.block.timestamp || 0n))
        ),
      };

      await prisma.userAction.upsert({
        where: { txHashes },
        update: data,
        create: data,
      });
    }

    await sleep(2000);
  }
};

export default syncMultiChainTransfers;
