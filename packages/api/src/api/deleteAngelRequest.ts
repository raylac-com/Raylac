import prisma from '../lib/prisma';

/**
 * Delete an angel request from the database
 */
const deleteAngelRequest = async ({
  userId,
  angelRequestId,
}: {
  userId: number;
  angelRequestId: number;
}) => {
  const angelRequest = await prisma.angelRequest.findUnique({
    where: { id: angelRequestId },
  });

  if (angelRequest?.userId !== userId) {
    throw new Error('You are not authorized to delete this angel request');
  }

  await prisma.angelRequest.delete({
    where: { id: angelRequestId, userId },
  });
};

export default deleteAngelRequest;
