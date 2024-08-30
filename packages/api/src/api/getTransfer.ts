import prisma from '@/lib/prisma';

const getTransferDetails = async ({ transferId }: { transferId: string }) => {
  if (transferId.startsWith('0x')) {
    // This is a tx hash
  }

  const transfer = await prisma.transfer.findUnique({
    where: {
      id: parseInt(transferId),
    },
  });

  return transfer;
};

export default getTransferDetails;
