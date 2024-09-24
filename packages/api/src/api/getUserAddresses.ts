import prisma from '@/lib/prisma';

const getUserAddresses = async ({ userId }: { userId: number }) => {
  return prisma.userStealthAddress.findMany({
    select: {
      address: true,
    },
    where: {
      userId,
    },
  });
};

export default getUserAddresses;
