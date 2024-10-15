import { Hex } from 'viem';
import prisma from '../lib/prisma';

const getAddressNonces = async ({ userId }: { userId: number }) => {
  const userAddresses = await prisma.userStealthAddress.findMany({
    select: {
      address: true,
    },
    where: {
      userId,
    },
  });

  const result = await prisma.userOperation.groupBy({
    by: ['sender'],
    _max: {
      nonce: true,
    },
    where: {
      sender: {
        in: userAddresses.map(address => address.address),
      },
    },
  });

  const addressNonces: Record<Hex, number | null> = {};

  for (const address of result) {
    addressNonces[address.sender as Hex] = address._max.nonce;
  }

  return addressNonces;
};

export default getAddressNonces;
