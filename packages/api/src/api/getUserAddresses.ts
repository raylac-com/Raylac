import prisma from '@/lib/prisma';

const getUserAddresses = async ({ userId }: { userId: number }) => {
  return prisma.userStealthAddress.findMany({
    select: {
      address: true,
      label: true,
    },
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });
};

export default getUserAddresses;
