import prisma from '../lib/prisma';

/**
 * Save the username for a user in the database
 */
const updateUsername = async ({
  userId,
  username,
}: {
  userId: number;
  username: string;
}) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      username,
    },
  });
};

export default updateUsername;
