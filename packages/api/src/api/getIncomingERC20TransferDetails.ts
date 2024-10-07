import prisma from '@/lib/prisma';

const getIncomingERC20TransferDetails = async ({
  txIndex,
  logIndex,
  blockNumber,
  chainId,
}: {
  txIndex: number;
  logIndex: number;
  blockNumber: number;
  chainId: number;
}) => {
  const result = await prisma.eRC20TransferLog.findUnique({
    where: {
      txIndex_logIndex_blockNumber_chainId: {
        txIndex,
        logIndex,
        blockNumber,
        chainId,
      },
    },
  });

  return result;
};

export default getIncomingERC20TransferDetails;
