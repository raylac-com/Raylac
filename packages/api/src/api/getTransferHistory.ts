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
    WITH native_transfers AS (
        SELECT
          amount,
          "from",
          "to",
          "tokenId",
          b.number AS "blockNumber",
          0 AS "txIndex",
          0 AS "logIndex",
          b. "chainId" AS "chainId",
          u1. "userId" AS "fromUserId",
          u2. "userId" AS "toUserId",
          "executionTag",
          "txHash",
          "traceAddress"
        FROM
          "TransferTrace" t
        LEFT JOIN "Transaction" tx ON tx.hash = t. "txHash"
        LEFT JOIN "Block" b ON b.hash = tx. "blockHash"
        LEFT JOIN "UserStealthAddress" u1 ON u1.address = t. "from"
        LEFT JOIN "UserStealthAddress" u2 ON u2.address = t. "to"
      WHERE (u1. "userId" = ${userId}
        OR u2. "userId" = ${userId})
      AND u1. "userId" IS DISTINCT FROM u2. "userId"
      AND tx. "chainId" in(${Prisma.join(chainIds)})
      ORDER BY
        b. "number" DESC,
        "txPosition" DESC
      ),
      erc20_transfers AS (
        SELECT
          amount,
          "from",
          "to",
          "tokenId",
          b.number AS "blockNumber",
          l. "txIndex",
          l. "logIndex",
          b. "chainId" AS "chainId",
          u1. "userId" AS "fromUserId",
          u2. "userId" AS "toUserId",
          "executionTag",
          "transactionHash" AS "txHash",
          '' AS "traceAddress"
        FROM
          "ERC20TransferLog" l
        LEFT JOIN "Transaction" tx ON tx.hash = l. "transactionHash"
        LEFT JOIN "Block" b ON b.hash = tx. "blockHash"
        LEFT JOIN "UserStealthAddress" u1 ON u1.address = l. "from"
        LEFT JOIN "UserStealthAddress" u2 ON u2.address = l. "to"
      WHERE (u1. "userId" = ${userId}
        OR u2. "userId" = ${userId})
      AND u1. "userId" IS DISTINCT FROM u2. "userId"
      AND tx. "chainId" in(${Prisma.join(chainIds)})
      ),
      transfers AS (
        SELECT
          *
        FROM
          native_transfers
        UNION ALL
        SELECT
          *
        FROM
          erc20_transfers
      )
      SELECT
        *
      FROM
        transfers
      ORDER BY
        "blockNumber" DESC
  `;

  return result.map(row => ({
    ...row,
    // Convert BigInt to Number
    blockNumber: Number(row.blockNumber),
  }));
};

export default getTransferHistory;
