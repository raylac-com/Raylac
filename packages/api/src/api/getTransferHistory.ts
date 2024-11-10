import prisma from '../lib/prisma';
import { devChains, supportedChains } from '@raylac/shared';

/**
 * Get the transaction history of all stealth addresses for a user
 */
const getTransferHistory = async ({
  userId,
  take,
  skip,
  includeAnvil = false,
}: {
  userId: number;
  take?: number;
  skip?: number;
  includeAnvil?: boolean;
}) => {
  const chainIds = supportedChains.map(chain => chain.id);

  if (includeAnvil) {
    chainIds.push(...devChains.map(c => c.id));
  }

  const transfers = await prisma.userAction.findMany({
    select: {
      id: true,
      transactions: {
        select: {
          chainId: true,
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
      },
      timestamp: true,
    },
    take,
    skip,
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Filter out the traces that are not to the user's stealth address
  const filteredTransactions = transfers.map(transfer => ({
    ...transfer,
    transactions: transfer.transactions.map(tx => {
      return {
        ...tx,
        traces: tx.traces.filter(
          trace =>
            trace.UserStealthAddressTo?.userId === userId ||
            trace.UserStealthAddressFrom?.userId === userId
        ),
      };
    }),
  }));

  return filteredTransactions;
};

export default getTransferHistory;
