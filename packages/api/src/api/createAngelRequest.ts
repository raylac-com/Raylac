import prisma from '../lib/prisma';

/**
 * Save an angel request to the database
 */
const createAngelRequest = async ({
  userId,
  title,
  description,
  usdAmount,
}: {
  userId: number;
  title: string;
  description: string;
  usdAmount: string;
}) => {
  const angelRequest = await prisma.angelRequest.create({
    data: {
      title,
      description,
      amount: usdAmount,
      userId,
    },
  });

  return angelRequest;
};

export default createAngelRequest;
