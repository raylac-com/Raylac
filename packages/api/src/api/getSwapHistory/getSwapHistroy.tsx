import { Hex } from 'viem';
import prisma from '../../lib/prisma';

const getSwapHistory = async ({ address }: { address: Hex }) => {
  const swaps = await prisma.swap.findMany({
    where: {
      address,
    },
  });

  return swaps;
};

export default getSwapHistory;
