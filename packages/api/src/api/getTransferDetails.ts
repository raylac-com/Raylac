import prisma from '../lib/prisma';

/**
 * Get the details of a transfer by its transaction hash and trace address
 */
const getTransferDetails = async ({ txHash }: { txHash: string }) => {
  const tx = await prisma.transaction.findUnique({
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
          logIndex: true,
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
    traces: tx?.traces,
  };
};

export default getTransferDetails;
