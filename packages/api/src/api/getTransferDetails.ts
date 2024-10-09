import prisma from '../lib/prisma';

const getTransferDetails = async ({ transferId }: { transferId: string }) => {
  const transfer = await prisma.transfer.findUnique({
    select: {
      maxBlockNumber: true,
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
      traces: {
        select: {
          id: true,
          from: true,
          to: true,
          tokenId: true,
          amount: true,
          Transaction: {
            select: {
              hash: true,
              block: {
                select: {
                  chainId: true,
                  number: true,
                },
              },
            },
          },
        },
      },
    },
    where: {
      transferId,
    },
  });

  return transfer;
};

export default getTransferDetails;
