import { Hex } from 'viem';
import prisma from '../lib/prisma';
import * as erc20 from '@/lib/erc20';

/**
 * Get all stealth accounts for a user
 */
const getStealthAccounts = async ({ userId }: { userId: number }) => {
  const addresses = await prisma.userStealthAddress.findMany({
    select: {
      address: true,
      stealthPubKey: true,
      viewTag: true,
      ephemeralPubKey: true,
    },
    where: {
      userId,
    },
  });

  const addressWithBalances = await Promise.all(
    addresses.map(async address => {
      const balance = await erc20.getUSDCBalance({
        address: address.address as Hex,
      });

      return {
        ...address,
        balance,
      };
    })
  );

  return addressWithBalances;
};

export default getStealthAccounts;
