import { Hex } from 'viem';
import prisma from '@/lib/prisma';

const updateAddressLabel = async ({
  userId,
  address,
  label,
}: {
  userId: number;
  address: Hex;
  label: string;
}) => {
  await prisma.userStealthAddress.update({
    where: {
      address,
      userId,
    },
    data: {
      label,
    },
  });
};

export default updateAddressLabel;
