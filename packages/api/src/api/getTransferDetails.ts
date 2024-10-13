import prisma from '../lib/prisma';

/**
 * Get the details of a transfer by its transaction hash and trace address
 */
const getTransferDetails = async ({
  userId,
  txHash,
}: {
  userId: number;
  txHash: string;
}) => {
  const tx = await prisma.transaction.findUnique({
    select: {
      block: {
        select: {
          number: true,
          timestamp: true,
        },
      },
      traces: {
        select: {
          traceAddress: true,
          tokenId: true,
          chainId: true,
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
      hash: true,
    },
    where: {
      hash: txHash,
    },
  });

  return {
    ...tx,
    traces: tx?.traces.filter(
      trace =>
        trace.UserStealthAddressTo?.userId === userId ||
        trace.UserStealthAddressFrom?.userId === userId
    ),
  };
};

export default getTransferDetails;
