import prisma from '../lib/prisma';

/**
 * Get the details of a transfer by its transaction hash and trace address
 */
const getTransferDetails = async ({
  userId,
  transferId,
}: {
  userId: number;
  transferId: number;
}) => {
  const tx = await prisma.userAction.findUnique({
    select: {
      timestamp: true,
      transactions: {
        select: {
          block: {
            select: {
              number: true,
              timestamp: true,
            },
          },
          userOps: {
            select: {
              hash: true,
              tokenPriceAtOp: true,
            },
          },
          traces: {
            select: {
              traceAddress: true,
              tokenId: true,
              chainId: true,
              tokenPriceAtTrace: true,
              UserStealthAddressFrom: {
                select: {
                  userId: true,
                  address: true,
                  user: {
                    select: {
                      spendingPubKey: true,
                      name: true,
                      username: true,
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
                      username: true,
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
        },
      },
    },
    where: {
      id: transferId,
    },
  });

  return {
    ...tx,
    transactions: tx?.transactions.map(tx => ({
      ...tx,
      traces: tx.traces.filter(
        trace =>
          trace.UserStealthAddressTo?.userId === userId ||
          trace.UserStealthAddressFrom?.userId === userId
      ),
    })),
  };
};

export default getTransferDetails;
