import prisma from '../lib/prisma';
import selectStealthAccounts from '../queries/selectStealthAccounts';

/**
 * Get all stealth accounts for a user
 */
const getStealthAccounts = async ({ userId }: { userId: number }) => {
  const accounts = await prisma.userStealthAddress.findMany({
    select: selectStealthAccounts,
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return accounts;
};

export default getStealthAccounts;
