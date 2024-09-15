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
      address: {
        not: "0x1053192d9Db45A2676025f3D117A8a20362238b1"
      }
    },
  });

  return addresses;
};

export default getStealthAccounts;
