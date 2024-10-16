import supportedChains from '@raylac/shared/out/supportedChains';
import prisma from './lib/prisma';
import {
  AccountBalancePerChainQueryResult,
  ERC20Abi,
  getPublicClient,
  sleep,
} from '@raylac/shared';
import { Hex } from 'viem';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import logger from './lib/logger';

const getAddressBalanceFromDb = async ({
  address,
  tokenId,
  chainId,
}: {
  address: Hex;
  tokenId: string;
  chainId: number;
}) => {
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
            u."address" = ${address}
            AND t."tokenId" = ${tokenId}
            AND "chainId" = ${chainId}
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
                u."address" = ${address}
                AND t."tokenId" = ${tokenId}
                AND "chainId" = ${chainId}
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

  if (accountBalancePerChain.length === 0) {
    return BigInt(0);
  }

  return BigInt(accountBalancePerChain[0].balance);
};

const getNativeBalance = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });
  return await client.getBalance({ address });
};

const getERC20Balance = async ({
  address,
  tokenAddress,
  chainId,
}: {
  address: Hex;
  tokenAddress: Hex;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });

  const balance = await client.readContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return balance;
};

const checkAddressBalances = async () => {
  while (true) {
    await sleep(60 * 10 * 1000); // 10 minutes

    const addresses = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
      },
    });
    logger.info(`Checking balances for ${addresses.length} addresses`);

    for (const address of addresses) {
      for (const token of supportedTokens) {
        for (const chain of supportedChains) {
          const balanceFromDb = await getAddressBalanceFromDb({
            address: address.address as Hex,
            tokenId: token.tokenId,
            chainId: chain.id,
          });

          if (token.tokenId === 'eth') {
            const nativeBalance = await getNativeBalance({
              address: address.address as Hex,
              chainId: chain.id,
            });

            if (balanceFromDb !== nativeBalance) {
              logger.error(
                `Native balance mismatch for address ${address.address} on chain ${chain.id}: ${balanceFromDb} !== ${nativeBalance}`
              );
            } else {
              logger.info(
                `Balance check: Native balance for address ${address.address} on chain ${chain.id}: ${nativeBalance} = ${balanceFromDb}`
              );
            }
          } else {
            const tokenAddress = token.addresses.find(
              tokenAddress => tokenAddress.chain.id === chain.id
            )?.address;

            if (!tokenAddress) {
              throw new Error(
                `Token ${token.tokenId} not found on chain ${chain.id}`
              );
            }

            const erc20Balance = await getERC20Balance({
              address: address.address as Hex,
              tokenAddress: tokenAddress,
              chainId: chain.id,
            });

            if (balanceFromDb !== erc20Balance) {
              logger.error(
                `ERC20 balance mismatch for address ${address.address} on chain ${chain.id}: ${balanceFromDb} !== ${erc20Balance}`
              );
            } else {
              logger.info(
                `Balance check: ERC20 balance for address ${address.address} on chain ${chain.id}: ${erc20Balance} = ${balanceFromDb} `
              );
            }
          }
        }
      }
    }
  }
};

export default checkAddressBalances;
