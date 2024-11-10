import { Prisma } from '@raylac/db';
import prisma from './lib/prisma';
import { Hex } from 'viem';
import { bigIntMax, decodeUserOperationTag, sleep } from '@raylac/shared';

const syncMultiChainTransfers = async ({
  chainIds,
}: {
  chainIds: number[];
}) => {
  while (true) {
    // Get all transactions that haven't been assigned to a `Transfer` yet
    const unassignedTxs = await prisma.transaction.findMany({
      select: {
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

    // Group the multi-chain transfers
    const multiChainTransfers: Record<
      string,
      {
        groupSize: number;
        transactions: {
          hash: string;
          block: {
            timestamp: bigint | null;
          };
        }[];
      }
    > = {};

    for (const tx of unassignedTxs) {
      if (!tx.tag || tx.tag === '0x') {
        continue;
      }

      const { groupTag, groupSize } = decodeUserOperationTag(tx.tag as Hex);

      // eslint-disable-next-line security/detect-object-injection
      multiChainTransfers[groupTag] = {
        groupSize,
        transactions: [
          // eslint-disable-next-line security/detect-object-injection
          ...(multiChainTransfers[groupTag]?.transactions || []),
          tx,
        ],
      };
    }

    // Create a new UserActions for the multi-chain transfers
    for (const [groupTag, group] of Object.entries(multiChainTransfers)) {
      // TODO: Handle conflicting groupTags

      // The txs are used to uniquely identify the UserAction
      const txHashes = group.transactions.map(tx => tx.hash).sort();

      const data: Prisma.UserActionCreateInput = {
        groupTag,
        groupSize: group.groupSize,
        transactions: {
          connect: group.transactions.map(tx => ({ hash: tx.hash })),
        },
        txHashes,
        // Use the timestamp of the latest transaction as the timestamp of the UserAction
        timestamp: bigIntMax(
          group.transactions.map(tx => BigInt(tx.block.timestamp || 0n))
        ),
      };

      await sleep(200);
      await prisma.userAction.upsert({
        update: data,
        create: data,
        where: {
          txHashes,
        },
      });
    }

    await sleep(3000);
  }
};

export default syncMultiChainTransfers;
