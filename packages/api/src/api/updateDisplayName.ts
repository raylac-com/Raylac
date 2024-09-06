import prisma from '@/lib/prisma';

/**
 *  Save the display name for a user in the database
 */
const updateDisplayName = async ({
  userId,
  name,
}: {
  userId: number;
  name: string;
}) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
    },
  });
};

export default updateDisplayName;
