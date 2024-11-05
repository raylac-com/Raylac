import prisma from '../lib/prisma';
import { supportedChains } from '@raylac/shared';

/**
 * Get the transaction history of all stealth addresses for a user
 */
const getTransferHistory = async ({
  userId,
  take,
  skip,
}: {
  userId: number;
  take?: number;
  skip?: number;
}) => {
  const chainIds = supportedChains.map(chain => chain.id);

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
    take,
    skip,
  });

  // Filter out the traces that are not to the user's stealth address
  const filteredTransactions = transactions.map(tx => {
    return {
      ...tx,
      traces: tx.traces.filter(
        trace =>
          trace.UserStealthAddressTo?.userId === userId ||
          trace.UserStealthAddressFrom?.userId === userId
      ),
    };
  });

  return filteredTransactions;
};

export default getTransferHistory;
