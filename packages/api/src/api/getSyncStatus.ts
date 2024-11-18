import { Hex } from 'viem';
import prisma from '../lib/prisma';

const getSyncStatus = async ({
  addresses,
  chainIds,
}: {
  addresses: Hex[];
  chainIds: number[];
}) => {
  const syncStatus = await prisma.syncTask.findMany({
    select: {
      address: true,
      chainId: true,
      blockNumber: true,
      blockHash: true,
      tokenId: true,
    },
    where: {
      address: { in: addresses },
      chainId: { in: chainIds },
    },
  });

  return syncStatus;
};

export default getSyncStatus;
