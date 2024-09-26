import prisma from '../lib/prisma';

const getUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      spendingPubKey: true,
      viewingPubKey: true,
      profileImage: true,
    },
  });

  return users;
};

export default getUsers;
