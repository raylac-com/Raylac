import prisma from '@/lib/prisma';
import { TokenBalancePerChainQueryResult } from '@raylac/shared';

/**
 * Get the balances of tokens for all chains and supported tokens
 * for a user
 */
const getTokenBalancesPerChain = async ({ userId }: { userId: number }) => {
  const tokenBalancePerChain = await prisma.$queryRaw<
    TokenBalancePerChainQueryResult[]
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
        "chainId",
        sum(amount) AS amount
      FROM
        "TransferTrace"
      WHERE
        "from" in(
          SELECT
            address FROM user_addresses)
      GROUP BY
        "tokenId",
        "chainId"
    ),
    total_transfers_in AS (
      SELECT
        "tokenId",
        "chainId",
        sum(amount) AS amount
      FROM
        "TransferTrace"
      WHERE
        "to" in(
          SELECT
            address FROM user_addresses)
      GROUP BY
        "tokenId",
        "chainId"
    )
    SELECT
      COALESCE(i. "chainId", o. "chainId") AS "chainId",
      COALESCE(i. "tokenId", o. "tokenId") AS "tokenId",
      COALESCE(i.amount, 0) - COALESCE(o.amount, 0) AS balance
    FROM
      total_transfers_in i
      FULL OUTER JOIN total_transfers_out o ON i. "tokenId" = o. "tokenId"
      AND i. "chainId" = o. "chainId"
  `;

  return tokenBalancePerChain;
};

export default getTokenBalancesPerChain;
