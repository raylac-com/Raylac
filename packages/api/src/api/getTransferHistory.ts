import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getChainsForMode, TransferHistoryQueryResult } from '@raylac/shared';

/**
 * Get the transaction history of all stealth addresses for a user
 */
const getTransferHistory = async ({
  userId,
  isDevMode,
}: {
  userId: number;
  isDevMode: boolean;
}): Promise<TransferHistoryQueryResult[]> => {
  const chainIds = getChainsForMode(isDevMode).map(chain => chain.id);

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
      "blockNumber",
      "executionTag",
    	"txHash",
    	"traceAddress"
    FROM
      "TransferTrace" t
      LEFT JOIN "UserStealthAddress" u1 ON u1.address = t. "from"
      LEFT JOIN "UserStealthAddress" u2 ON u2.address = t. "to"
    WHERE
      (u1. "userId" = ${userId}
      OR u2. "userId" = ${userId})
      AND u1. "userId" IS DISTINCT FROM u2. "userId"
      AND "chainId" in (${Prisma.join(chainIds)})
    ORDER BY
      "blockNumber" DESC,
      "txPosition" DESC
  `;

  return result.map(row => ({
    ...row,
    // Convert BigInt to Number
    blockNumber: Number(row.blockNumber),
  }));
};

export default getTransferHistory;
