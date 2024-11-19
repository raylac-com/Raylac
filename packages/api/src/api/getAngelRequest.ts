import prisma from '../lib/prisma';

/**
 * Get an angel request from the database
 */
const getAngelRequest = async ({
  angelRequestId,
}: {
  angelRequestId: number;
}) => {
  const angelRequest = await prisma.angelRequest.findUnique({
    select: {
      id: true,
      description: true,
      amount: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          spendingPubKey: true,
          profileImage: true,
        },
      },
    },
    where: { id: angelRequestId },
  });

  return angelRequest;
};

export default getAngelRequest;
