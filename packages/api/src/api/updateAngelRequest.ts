import prisma from '../lib/prisma';

/**
 * Update an angel request in the database
 */
const updateAngelRequest = async ({
  angelRequestId,
  title,
  description,
  usdAmount,
}: {
  angelRequestId: number;
  title: string;
  description: string;
  usdAmount: string;
}) => {
  await prisma.angelRequest.update({
    where: { id: angelRequestId },
    data: { description, amount: usdAmount, title },
  });
};

export default updateAngelRequest;
