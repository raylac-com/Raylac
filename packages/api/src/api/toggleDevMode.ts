import prisma from '../lib/prisma';

const toggleDevMode = async ({
  userId,
  devModeEnabled,
}: {
  userId: number;
  devModeEnabled: boolean;
}) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      devModeEnabled,
    },
  });
};

export default toggleDevMode;
