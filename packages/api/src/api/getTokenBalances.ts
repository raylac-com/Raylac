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
  console.log('chainIds', chainIds);

  const tokenBalancePerChain = await prisma.$queryRaw<
    TokenBalanceQueryResult[]
  >`
    WITH user_addresses AS (
	SELECT
		address
	FROM
		"UserStealthAddress"
	WHERE
		"userId" = ${userId}
        ),
        total_transfers_out AS (
            SELECT
                "tokenId",
                sum(amount) AS amount
            FROM
                "TransferTrace"
            WHERE
                "from" in(
                    SELECT
                        address FROM user_addresses)
                AND "chainId" in (${Prisma.join(chainIds)})
            GROUP BY
                "tokenId"
        ),
        total_transfers_in AS (
            SELECT
                "tokenId",
                sum(amount) AS amount
            FROM
                "TransferTrace"
            WHERE
                "to" in(
                    SELECT
                        address FROM user_addresses)
                AND "chainId" in (${Prisma.join(chainIds)})
            GROUP BY
                "tokenId"
        )
        SELECT
            COALESCE(i. "tokenId", o. "tokenId") AS "tokenId",
            COALESCE(i.amount, 0) - COALESCE(o.amount, 0) AS balance
        FROM
            total_transfers_in i
            FULL OUTER JOIN total_transfers_out o ON i. "tokenId" = o. "tokenId"
  `;

  return tokenBalancePerChain;
};

export default getTokenBalances;
