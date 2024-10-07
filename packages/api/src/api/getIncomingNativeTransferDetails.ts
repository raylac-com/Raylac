import prisma from '@/lib/prisma';
import { Hex } from 'viem';

const getIncomingNativeTransferDetails = async ({
  txHash,
  traceAddress,
}: {
  txHash: Hex;
  traceAddress: string;
}) => {
  const result = await prisma.transferTrace.findUnique({
    select: {
      amount: true,
      from: true,
      to: true,
      tokenId: true,
      chainId: true,
      Transaction: {
        select: {
          hash: true,
          block: {
            select: {
              number: true,
            },
          },
        },
      },
    },
    where: {
      txHash_traceAddress: {
        txHash,
        traceAddress,
      },
    },
  });

  return result;
};

export default getIncomingNativeTransferDetails;
