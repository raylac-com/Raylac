import prisma from '../lib/prisma';

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

  return addresses;
};

export default getStealthAccounts;
