import prisma from '../lib/prisma';
import { Prisma } from '@raylac/db';
import {
  AccountBalancePerChainQueryResult,
  supportedChains,
} from '@raylac/shared';
import { logger } from '../utils';
import { anvil } from 'viem/chains';

/**
 * Get the balances of tokens for all chains and supported tokens
 * for a user
 */
const getAddressBalancesPerChain = async ({
  userId,
  includeAnvil,
}: {
  userId: number;
  includeAnvil?: boolean;
}) => {
  const chainIds = supportedChains.map(chain => chain.id);

  if (includeAnvil) {
    chainIds.push(anvil.id);
  }

  logger.info(`Getting address balances for user ${userId}`);

  const accountBalancePerChain = await prisma.$queryRaw<
    AccountBalancePerChainQueryResult[]
  >`
        WITH incoming_transfers AS (
	SELECT
		sum(amount) AS amount,
		"tokenId",
                "chainId",
                "address"
	FROM
		"Trace" t
	LEFT JOIN "UserStealthAddress" u ON t. "toStealthAddress" = u.address
        WHERE
            u. "userId" = ${userId}
            AND "chainId" in (${Prisma.join(chainIds)})
        GROUP BY
            "tokenId",
            "address",
            "chainId"
        ),
        outgoing_transfers AS (
            SELECT
                sum(amount) AS amount,
                "tokenId",
                "chainId",
                "address"
            FROM
                "Trace" t
            LEFT JOIN "UserStealthAddress" u ON t. "fromStealthAddress" = u.address
        WHERE
            u. "userId" = ${userId}
            AND "chainId" in (${Prisma.join(chainIds)})
        GROUP BY
            "tokenId",
            "chainId",
            "address"
        )
        SELECT
            COALESCE(i. "tokenId", o. "tokenId") AS "tokenId",
            COALESCE(i.amount, 0) - COALESCE(o.amount, 0) AS balance,
            i."chainId",
            i."address"
        FROM
            incoming_transfers i
            LEFT JOIN outgoing_transfers o ON i. "tokenId" = o. "tokenId"
            AND i. "chainId" = o. "chainId"
            AND i. "address" = o. "address"
  `;

  return accountBalancePerChain;
};

export default getAddressBalancesPerChain;
