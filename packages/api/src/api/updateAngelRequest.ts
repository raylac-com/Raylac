import prisma from '../lib/prisma';

/**
 * Update an angel request in the database
 */
const updateAngelRequest = async ({
  angelRequestId,
  description,
  usdAmount,
}: {
  angelRequestId: number;
  description: string;
  usdAmount: string;
}) => {
  await prisma.angelRequest.update({
    where: { id: angelRequestId },
    data: { description, amount: usdAmount },
  });
};

export default updateAngelRequest;
