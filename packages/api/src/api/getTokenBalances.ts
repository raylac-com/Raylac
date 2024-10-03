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
    WITH user_addresses AS (
	SELECT
		address
	FROM
		"UserStealthAddress"
	WHERE
		"userId" = ${userId}
    ),
    native_transfers_out AS (
        SELECT
            sum(amount) AS amount
        FROM
            "TransferTrace"
        WHERE
            "from" in(
                SELECT
                    address FROM user_addresses)
            AND "chainId" in (${Prisma.join(chainIds)})
    ),
    native_transfers_in AS (
        SELECT
            sum(amount) AS amount
        FROM
            "TransferTrace"
        WHERE
            "to" in(
                SELECT
                    address FROM user_addresses)
            AND "chainId" in (${Prisma.join(chainIds)})
    ),
    erc20_transfers_in AS (
        SELECT
            "tokenId",
            sum(amount) AS amount
        FROM
            "ERC20TransferLog"
        WHERE
            "to" in(
                SELECT
                    address FROM user_addresses)
            AND "chainId" in (${Prisma.join(chainIds)})
        GROUP BY
            "tokenId"
    ),
    erc20_transfers_out AS (
        SELECT
            "tokenId",
            sum(amount) AS amount
        FROM
            "ERC20TransferLog"
        WHERE
            "from" in(
                SELECT
                    address FROM user_addresses)
            AND "chainId" in (${Prisma.join(chainIds)})
        GROUP BY
            "tokenId"
    ),
    native_balance AS (
        SELECT
            COALESCE((native_transfers_in.amount - native_transfers_out.amount),
            0) AS balance,
            'eth' AS "tokenId"
        FROM
            native_transfers_in,
            native_transfers_out
    ),
    erc20_balance AS (
        SELECT
            COALESCE(i. "tokenId",
                o. "tokenId") AS "tokenId",
            COALESCE(i.amount,
                0) - COALESCE(o.amount,
                0) AS balance
        FROM
            erc20_transfers_in i
        FULL OUTER JOIN erc20_transfers_out o ON i. "tokenId" = o. "tokenId"
    )
    SELECT
        "tokenId",
        balance
    FROM
        erc20_balance
    UNION
    SELECT
        "tokenId",
        balance
    FROM
        native_balance
  `;

  return tokenBalances;
};

export default getTokenBalances;
