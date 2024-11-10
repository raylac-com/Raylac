import prisma from '../lib/prisma';

/**
 * Get all stealth accounts for a user
 */
const getStealthAccounts = async ({ userId }: { userId: number }) => {
  const accounts = await prisma.userStealthAddress.findMany({
    select: {
      address: true,
      signerAddress: true,
      viewTag: true,
      ephemeralPubKey: true,
      label: true,
      userOps: {
        select: {
          nonce: true,
          chainId: true,
          success: true,
        },
        orderBy: {
          nonce: 'desc',
        },
      },
    },
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Assign the nonce to the account
  const accountsWithNonce = accounts.map(account => ({
    ...account,
    nonce: account.userOps.length > 0 ? account.userOps[0].nonce : null,
  }));

  return accountsWithNonce;
};

export default getStealthAccounts;
