import prisma from '../lib/prisma';

/**
 * Save an angel request to the database
 */
const createAngelRequest = async ({
  userId,
  description,
  usdAmount,
}: {
  userId: number;
  description: string;
  usdAmount: string;
}) => {
  const angelRequest = await prisma.angelRequest.create({
    data: {
      description,
      amount: usdAmount,
      userId,
    },
  });

  return angelRequest;
};

export default createAngelRequest;
