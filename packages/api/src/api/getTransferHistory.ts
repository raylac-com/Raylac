import prisma from '@/lib/prisma';
import { getBlockTimestamp } from '@/utils';
import { TransferHistoryQueryResult } from '@raylac/shared';

/**
 * Get the transaction history of all stealth addresses for a user
 */
const getTransferHistory = async ({
  userId,
}: {
  userId: number;
}): Promise<TransferHistoryQueryResult[]> => {
  const result = await prisma.$queryRaw<TransferHistoryQueryResult[]>`
    SELECT
      amount,
      "executionType",
      "from",
      "to",
      "tokenId",
    	"chainId",  
      u1. "userId" AS "fromUserId",
      u2. "userId" AS "toUserId",
      "blockNumber"
    FROM
      "TransferTrace" t
      LEFT JOIN "UserStealthAddress" u1 ON u1.address = t. "from"
      LEFT JOIN "UserStealthAddress" u2 ON u2.address = t. "to"
    WHERE
      u1. "userId" = ${userId}
      OR u2. "userId" = ${userId}
    ORDER BY
      "blockNumber" DESC,
      "txPosition" DESC
  `;

  const withTimestamps = await Promise.all(
    result.map(async transfer => {
      const timestamp = await getBlockTimestamp(
        transfer.blockNumber,
        transfer.chainId
      );

      return {
        ...transfer,
        timestamp,
      };
    })
  );

  return withTimestamps;
};

export default getTransferHistory;
