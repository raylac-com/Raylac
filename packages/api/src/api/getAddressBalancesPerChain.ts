import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  AccountBalancePerChainQueryResult,
  getChainsForMode,
} from '@raylac/shared';

/**
 * Get the balances of tokens for all chains and supported tokens
 * for a user
 */
const getAddressBalancesPerChain = async ({
  userId,
  isDevMode,
}: {
  userId: number;
  isDevMode: boolean;
}) => {
  const chainIds = getChainsForMode(isDevMode).map(chain => chain.id);

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
        "chainId" in (${Prisma.join(chainIds)}) AND
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
            "chainId" in (${Prisma.join(chainIds)}) AND
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
    ),
    account_nonces AS (
        SELECT
            sender AS "address",
            "chainId",
            max(nonce) AS nonce
        FROM
            "UserOperation"
    WHERE
        success = TRUE
    GROUP BY
        sender,
        "chainId"
    )
    SELECT
        a.*,
        u. "ephemeralPubKey",
        u. "stealthPubKey",
        u. "viewTag",
        an.nonce
    FROM
        address_balances a
        LEFT JOIN "UserStealthAddress" u ON a.address = u.address
        LEFT JOIN account_nonces an ON an.address = a.address
		AND an. "chainId" = a. "chainId"
  `;

  return accountBalancePerChain;
};

export default getAddressBalancesPerChain;
