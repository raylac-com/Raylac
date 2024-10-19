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

  const transactions = await prisma.transaction.findMany({
    select: {
      block: {
        select: {
          number: true,
          timestamp: true,
        },
      },
      userOps: {
        select: {
          tokenPriceAtOp: true,
        },
      },
      traces: {
        select: {
          tokenId: true,
          chainId: true,
          traceAddress: true,
          logIndex: true,
          tokenPriceAtTrace: true,
          UserStealthAddressFrom: {
            select: {
              userId: true,
              address: true,
              user: {
                select: {
                  spendingPubKey: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          UserStealthAddressTo: {
            select: {
              userId: true,
              address: true,
              user: {
                select: {
                  spendingPubKey: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          from: true,
          to: true,
          amount: true,
          transactionHash: true,
        },
      },
      hash: true,
    },
    where: {
      OR: [
        {
          traces: {
            some: {
              UserStealthAddressFrom: {
                userId,
              },
            },
          },
        },
        {
          traces: {
            some: {
              UserStealthAddressTo: {
                userId,
              },
            },
          },
        },
      ],
      chainId: { in: chainIds },
    },
    orderBy: {
      block: {
        number: 'desc',
      },
    },
  });

  // Filter out the traces that are not to the user's stealth address
  const filteredTransactions = transactions.map(tx => {
    return {
      ...tx,
      traces: tx.traces,
    };
  });

  return filteredTransactions;
};

export default getTransferHistory;
