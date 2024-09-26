import prisma from '@/lib/prisma';

const getUser = async ({ userId }: { userId: number }) => {
  return await prisma.user.findUnique({
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
      spendingPubKey: true,
    },
    where: {
      id: userId,
    },
  });
};

export default getUser;
