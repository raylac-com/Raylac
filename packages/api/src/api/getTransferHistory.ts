import prisma from '../lib/prisma';
import { getChainsForMode } from '@raylac/shared';

/**
 * Get the transaction history of all stealth addresses for a user
 */
const getTransferHistory = async ({
  userId,
  isDevMode,
}: {
  userId: number;
  isDevMode: boolean;
}) => {
  const chainIds = getChainsForMode(isDevMode).map(chain => chain.id);

  const result = await prisma.transfer.findMany({
    select: {
      fromUser: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
          spendingPubKey: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
          spendingPubKey: true,
        },
      },
      fromAddress: true,
      toAddress: true,
      transferId: true,
      maxBlockNumber: true,
      traces: {
        select: {
          id: true,
          from: true,
          to: true,
          amount: true,
          tokenId: true,
          Transaction: {
            select: {
              block: {
                select: {
                  chainId: true,
                },
              },
            },
          },
        },
      },
    },
    where: {
      OR: [
        {
          fromUser: {
            id: userId,
          },
        },
        {
          toUser: {
            id: userId,
          },
        },
      ],
      traces: {
        some: {
          Transaction: {
            block: {
              chainId: {
                in: chainIds,
              },
            },
          },
        },
      },
    },
    orderBy: {
      maxBlockNumber: 'desc',
    },
  });

  return result.map(row => ({
    ...row,
    maxBlockNumber: Number(row.maxBlockNumber),
  }));
};

export default getTransferHistory;
