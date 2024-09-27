import prisma from '../lib/prisma';

const deleteAccount = async ({ userId }: { userId: number }) => {
  await prisma.userStealthAddress.deleteMany({
    where: {
      userId,
    },
  });

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });
};

export default deleteAccount;
