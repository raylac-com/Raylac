import prisma from '@/lib/prisma';
import { AccountBalancePerChainQueryResult } from '@raylac/shared';

/**
 * Get the balances of tokens for all chains and supported tokens
 * for a user
 */
const getAddressBalancesPerChain = async ({ userId }: { userId: number }) => {
  const accountBalancePerChain = await prisma.$queryRaw<
    AccountBalancePerChainQueryResult[]
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
            "from",
            sum(amount) AS amount
        FROM
            "TransferTrace"
        WHERE
            "from" in(
                SELECT
                    address FROM user_addresses)
        GROUP BY
            "tokenId",
            "chainId",
            "from"
    ),
    total_transfers_in AS (
        SELECT
            "tokenId",
            "chainId",
            "to",
            sum(amount) AS amount
        FROM
            "TransferTrace"
        WHERE
            "to" in(
                SELECT
                    address FROM user_addresses)
        GROUP BY
            "tokenId",
            "chainId",
            "to"
    ),
    address_balances AS (
        SELECT
            COALESCE(i. "chainId",
                o. "chainId") AS "chainId",
            COALESCE(i. "tokenId",
                o. "tokenId") AS "tokenId",
            COALESCE(i.amount,
                0) - COALESCE(o.amount,
                0) AS balance,
            COALESCE(i. "to",
                o. "from") AS address
        FROM
            total_transfers_in i
        FULL OUTER JOIN total_transfers_out o ON i. "tokenId" = o. "tokenId"
        AND i. "chainId" = o. "chainId"
        AND i. "to" = o. "from"
    )
    SELECT
        a.*,
        u. "ephemeralPubKey",
        u. "stealthPubKey",
        u. "viewTag"
    FROM
        address_balances a
        LEFT JOIN "UserStealthAddress" u ON a.address = u.address
  `;

  return accountBalancePerChain;
};

export default getAddressBalancesPerChain;
