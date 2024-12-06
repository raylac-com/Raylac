import { Hex } from 'viem';
import prisma from '../../lib/prisma';

const getSwapHistory = async ({ address }: { address: Hex }) => {
  const swaps = await prisma.swap.findMany({
    select: {
      usdAmountIn: true,
      usdAmountOut: true,
      amountOut: true,
      amountIn: true,
      tokenAddressIn: true,
      tokenAddressOut: true,
    },
    where: {
      address,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return swaps;
};

export default getSwapHistory;
