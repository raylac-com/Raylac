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

  const balances = await Promise.all(
    addresses.map(async address => {
      return erc20.getUSDCBalance({ address: address.address as Hex });
    })
  );

  const totalBalance = balances.reduce((acc, balance) => {
    return acc + balance;
  }, BigInt(0));

  return totalBalance;
};

export default getBalance;
