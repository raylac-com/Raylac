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
      relayerServiceFeeAmount: true,
      relayerServiceFeeUsd: true,
      relayerServiceFeeTokenAddress: true,
      relayerServiceFeeChainId: true,
      transactions: {
        select: {
          hash: true,
          chainId: true,
        },
      },
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
