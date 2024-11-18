import prisma from '../lib/prisma';
import selectTransfer from '../queries/selectTransfer';
import { parseTransferData } from '../utils';

/**
 * Get the details of a transfer by its transaction hash and trace address
 */
const getTransferDetails = async ({
  transferId,
  userId,
}: {
  transferId: number;
  userId: number;
}) => {
  const transfer = await prisma.userAction.findUnique({
    select: selectTransfer,
    where: {
      id: transferId,
    },
  });

  if (!transfer) {
    throw new Error(`Transfer with id ${transferId} not found`);
  }

  return parseTransferData({ transfer, userId });
};

export default getTransferDetails;
