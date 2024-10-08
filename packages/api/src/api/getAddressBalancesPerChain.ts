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
        WITH incoming_transfers AS (
            SELECT
                tc. "tokenId",
                tc. "to",
                b. "chainId",
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
            "tokenId",
            b. "chainId",
            tc.to
        ),
        outgoing_transfers AS (
            SELECT
                tc. "tokenId",
                tc. "from",
                b. "chainId",
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
            tc. "tokenId",
            b. "chainId",
            tc. "from"
        ),
        address_balances AS (
            SELECT
                COALESCE(i. "tokenId",
                    o. "tokenId") AS "tokenId",
                COALESCE(i.amount,
                    0) - COALESCE(o.amount,
                    0) AS balance,
                COALESCE(i. "to",
                    o. "from") AS address,
                COALESCE(i. "chainId",
                    o. "chainId") AS "chainId"
            FROM
                incoming_transfers i
            LEFT JOIN outgoing_transfers o ON i. "tokenId" = o. "tokenId"
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
            an.nonce
        FROM
            address_balances a
            LEFT JOIN account_nonces an ON an.address = a.address
                AND an. "chainId" = a. "chainId"
  `;

  return accountBalancePerChain;
};

export default getAddressBalancesPerChain;
