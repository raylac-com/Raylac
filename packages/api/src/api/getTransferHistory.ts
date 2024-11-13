import prisma from '../lib/prisma';
import { devChains, supportedChains } from '@raylac/shared';
import selectTransfer from '../queries/selectTransfer';
import { parseTransferData } from '../utils';
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
    select: selectTransfer,
    where: {
      transactions: {
        some: {
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
    },
    take,
    skip,
    orderBy: {
      timestamp: 'desc',
    },
  });

  const filteredTransactions = transfers.map(transfer =>
    parseTransferData({ transfer, userId })
  );

  return filteredTransactions;
};

export default getTransferHistory;
