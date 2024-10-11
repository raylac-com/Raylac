import prisma from '../lib/prisma';

/**
 * Get all stealth accounts for a user
 */
const getStealthAccounts = async ({ userId }: { userId: number }) => {
  const addresses = await prisma.userStealthAddress.findMany({
    select: {
      address: true,
      signerAddress: true,
      viewTag: true,
      ephemeralPubKey: true,
      label: true,
    },
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return addresses;
};

export default getStealthAccounts;
