import { TRPCError } from '@trpc/server';
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
  const usernameExists = await prisma.user.findFirst({
    where: {
      username,
      NOT: {
        id: userId,
      },
    },
  });

  if (usernameExists) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Username already taken',
    });
  }

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
