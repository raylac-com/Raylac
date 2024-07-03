import prisma from './lib/prisma';

const mixer = async () => {
  // Split transfers to the admin account into smaller same amounts
  // Have some fake admin accounts to obscure the real users

  // Get all assigned stealth addresses

  // Get all transfers sent to the admin account

  // Forward that to the original user's new stealth address

  const unmixedStealthAddresses = await prisma.userStealthAddress.findMany({
    where: {
      mixed: false,
    },
  });
};

mixer();
