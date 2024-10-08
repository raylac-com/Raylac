import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getChainsForMode, TokenBalanceQueryResult } from '@raylac/shared';

/**
 * Get the balances of tokens for all chains and supported tokens
 * for a user
 */
const getTokenBalances = async ({
  userId,
  isDevMode,
}: {
  userId: number;
  isDevMode: boolean;
}) => {
  const chainIds = getChainsForMode(isDevMode).map(chain => chain.id);

  const tokenBalances = await prisma.$queryRaw<TokenBalanceQueryResult[]>`
    WITH incoming_transfers AS (
	SELECT
		tc. "tokenId",
		SUM(tc.amount) AS "amount"
	FROM
		"Transfer" t
	LEFT JOIN "Trace" tc ON t. "transferId" = tc. "transferId"
	LEFT JOIN "Transaction" tx ON tc. "transactionHash" = tx.hash
	LEFT JOIN "Block" b ON tx. "blockHash" = b.hash
    WHERE
        t. "toUserId" = ${userId}
        AND b. "chainId" in(${Prisma.join(chainIds)})
    GROUP BY
        "tokenId"
    ),
    outgoing_transfers AS (
        SELECT
            tc. "tokenId",
            SUM(tc.amount) AS "amount"
        FROM
            "Transfer" t
        LEFT JOIN "Trace" tc ON t. "transferId" = tc. "transferId"
        LEFT JOIN "Transaction" tx ON tc. "transactionHash" = tx.hash
        LEFT JOIN "Block" b ON tx. "blockHash" = b.hash
    WHERE
        t. "fromUserId" = ${userId}
        AND b. "chainId" in(${Prisma.join(chainIds)})
    GROUP BY
        "tokenId"
    )
    SELECT
        COALESCE(i. "tokenId", o. "tokenId") AS "tokenId",
        COALESCE(i.amount, 0) - COALESCE(o.amount, 0) AS balance
    FROM
        incoming_transfers i
        LEFT JOIN outgoing_transfers o ON i. "tokenId" = o. "tokenId"
  `;

  return tokenBalances;
};

export default getTokenBalances;
