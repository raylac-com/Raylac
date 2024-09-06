/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from '@/lib/prisma';
import * as erc20 from '@/lib/erc20';
import { Hex } from 'viem';

/**
 * Get the total USDC balance of all stealth addresses for a user
 */
const getBalance = async ({ userId }: { userId: number }) => {
  const addresses = await prisma.userStealthAddress.findMany({
    select: {
      address: true,
    },
    where: {
      userId,
    },
  });

  // TODO: Get the balance from the database by going through the transfers

  return BigInt(120000000);
};

export default getBalance;
