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
    native_transfers_out AS (
        SELECT
            "chainId",
            "from",
            sum(amount) AS amount
        FROM
            "TransferTrace"
        WHERE
            "chainId" in(${Prisma.join(chainIds)})
            AND "from" in(
                SELECT
                    address FROM user_addresses)
        GROUP BY
            "chainId",
            "from"
    ),
    native_transfers_in AS (
        SELECT
            "chainId",
            "to",
            sum(amount) AS amount
        FROM
            "TransferTrace"
        WHERE
            "chainId" in(${Prisma.join(chainIds)})
            AND "to" in(
                SELECT
                    address FROM user_addresses)
        GROUP BY
            "chainId",
            "to"
    ),
    native_balances AS (
        SELECT
            COALESCE(i. "chainId",
                o. "chainId") AS "chainId",
            COALESCE(i.amount,
                0) - COALESCE(o.amount,
                0) AS balance,
            COALESCE(i. "to",
                o. "from") AS address,
            'eth' AS "tokenId"
        FROM
            native_transfers_in i
        FULL OUTER JOIN native_transfers_out o ON i. "chainId" = o. "chainId"
        AND i. "to" = o. "from"
    ),
    erc20_transfers_out AS (
        SELECT
            "chainId",
            "from",
            "tokenId",
            sum(amount) AS amount
        FROM
            "ERC20TransferLog"
    WHERE
        "chainId" in(${Prisma.join(chainIds)})
        AND "from" in(
            SELECT
                address FROM user_addresses)
    GROUP BY
        "chainId",
        "from",
        "tokenId"
    ),
    erc20_transfers_in AS (
        SELECT
            "chainId",
            "to",
            "tokenId",
            sum(amount) AS amount
        FROM
            "ERC20TransferLog"
        WHERE
            "chainId" in(${Prisma.join(chainIds)})
            AND "to" in(
                SELECT
                    address FROM user_addresses)
        GROUP BY
            "chainId",
            "to",
            "tokenId"
    ),
    erc20_balances AS (
        SELECT
            COALESCE(i. "chainId",
                o. "chainId") AS "chainId",
            COALESCE(i.amount,
                0) - COALESCE(o.amount,
                0) AS balance,
            COALESCE(i. "to",
                o. "from") AS address,
            COALESCE(i. "tokenId",
                o. "tokenId") AS "tokenId"
        FROM
            erc20_transfers_in i
        FULL OUTER JOIN erc20_transfers_out o ON i. "tokenId" = o. "tokenId"
        AND i. "chainId" = o. "chainId"
        AND i. "to" = o. "from"
    ),
    address_balances AS (
        SELECT
            *
        FROM
            erc20_balances
        UNION
        SELECT
            *
        FROM
            native_balances
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
