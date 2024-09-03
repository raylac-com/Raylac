/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from './prisma';

/**
 * Save a stealth transfer to Postgres
 */
export const saveStealthTransfer = async ({
  senderId,
  amount,
  to,
  userOpHashes,
}: {
  senderId: number;
  amount: bigint;
  to: string;
  userOpHashes: string[];
}) => {
  /*
  await prisma.stealthTransfer.create({
    data: {
      senderId,
      amount,
      to,
      // Create empty user op receipts for the user ops.
      // This should be filled by the indexer once the user ops are processed
      userOpReceipts: {
        createMany: {
          data: userOpHashes.map(hash => ({
            hash,
          })),
        },
      },
    },
  });
  */
};
