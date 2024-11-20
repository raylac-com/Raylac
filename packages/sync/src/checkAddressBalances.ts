import prisma from './lib/prisma';
import {
  AccountBalancePerChainQueryResult,
  ERC20Abi,
  getPublicClient,
  getChainName,
} from '@raylac/shared';
import { Hex } from 'viem';
import { supportedTokens } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import { endTimer, loop, startTimer } from './utils';

const getAddressBalanceFromDb = async ({
  address,
  tokenId,
  chainId,
  blockNumber,
}: {
  address: Hex;
  tokenId: string;
  chainId: number;
  blockNumber: bigint;
}) => {
  const accountBalancePerChain = await prisma.$queryRaw<
    AccountBalancePerChainQueryResult[]
  >`
        WITH incoming_transfers AS (
      SELECT
        sum(amount) AS amount,
        t. "tokenId",
        t. "chainId",
        t. "to"
      FROM
        "Trace" t
      LEFT JOIN "Transaction" tx ON t. "transactionHash" = tx. "hash"
      LEFT JOIN "Block" b ON tx. "blockHash" = b. "hash"
    WHERE
      t. "to" = ${address}
      AND t. "tokenId" = ${tokenId}
      AND t. "chainId" = ${chainId}
      AND b."number" <= ${blockNumber}
    GROUP BY
      t. "tokenId",
      t. "to",
      t. "chainId"
    ),
    outgoing_transfers AS (
      SELECT
        sum(amount) AS amount,
        t. "tokenId",
        t. "chainId",
        t. "from"
      FROM
        "Trace" t
      LEFT JOIN "Transaction" tx ON t. "transactionHash" = tx. "hash"
      LEFT JOIN "Block" b ON tx. "blockHash" = b. "hash"
    WHERE
      t. "from" = ${address}
      AND t. "tokenId" = ${tokenId}
      AND t. "chainId" = ${chainId}
      AND b."number" <= ${blockNumber}
    GROUP BY
      t. "tokenId",
      t. "from",
      t. "chainId"
    )
    SELECT
      COALESCE(i. "tokenId", o. "tokenId") AS "tokenId",
      COALESCE(i.amount, 0) - COALESCE(o.amount, 0) AS balance,
      i. "chainId",
      i. "to" AS "address"
    FROM
      incoming_transfers i
      LEFT JOIN outgoing_transfers o ON i. "tokenId" = o. "tokenId"
        AND i. "chainId" = o. "chainId"
        AND i. "to" = o. "from"
  `;

  if (accountBalancePerChain.length === 0) {
    return BigInt(0);
  }

  return BigInt(accountBalancePerChain[0].balance);
};

const getNativeBalance = async ({
  address,
  chainId,
  blockNumber,
}: {
  address: Hex;
  chainId: number;
  blockNumber: bigint;
}) => {
  const client = getPublicClient({ chainId });
  return await client.getBalance({ address, blockNumber });
};

const getERC20Balance = async ({
  address,
  tokenAddress,
  chainId,
  blockNumber,
}: {
  address: Hex;
  tokenAddress: Hex;
  chainId: number;
  blockNumber: bigint;
}) => {
  const client = getPublicClient({ chainId });

  const balance = await client.readContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: [address],
    blockNumber,
  });

  return balance;
};

const checkAddressBalances = async ({ chainIds }: { chainIds: number[] }) => {
  await loop({
    interval: 1000 * 60 * 10, // 10 minutes
    fn: async () => {
      const syncTasks = await prisma.syncTask.findMany({
        select: {
          address: true,
          tokenId: true,
          chainId: true,
          blockNumber: true,
        },
        where: {
          tokenId: { not: 'userOps' },
          chainId: { in: chainIds },
        },
      });

      let matches = 0;
      let mismatches = 0;

      const timer = startTimer('Balance check');
      for (const syncTask of syncTasks) {
        const balanceFromDb = await getAddressBalanceFromDb({
          address: syncTask.address as Hex,
          tokenId: syncTask.tokenId,
          chainId: syncTask.chainId,
          blockNumber: syncTask.blockNumber,
        });

        if (syncTask.tokenId === 'eth') {
          const nativeBalance = await getNativeBalance({
            address: syncTask.address as Hex,
            chainId: syncTask.chainId,
            blockNumber: syncTask.blockNumber,
          });

          if (balanceFromDb !== nativeBalance) {
            logger.error(
              `Native balance mismatch for address ${syncTask.address} on ${getChainName(syncTask.chainId)}: ${balanceFromDb} !== ${nativeBalance} at block ${syncTask.blockNumber}`
            );
            mismatches++;
          } else {
            matches++;
          }
        } else {
          const tokenAddress = supportedTokens
            .find(token => token.tokenId === syncTask.tokenId)
            ?.addresses.find(
              tokenAddress => tokenAddress.chain.id === syncTask.chainId
            )?.address;

          if (!tokenAddress) {
            throw new Error(
              `Token ${syncTask.tokenId} not found on ${getChainName(syncTask.chainId)}`
            );
          }

          const erc20Balance = await getERC20Balance({
            address: syncTask.address as Hex,
            tokenAddress,
            chainId: syncTask.chainId,
            blockNumber: syncTask.blockNumber,
          });

          if (balanceFromDb !== erc20Balance) {
            logger.error(
              `ERC20 balance mismatch for address ${syncTask.address} on ${getChainName(syncTask.chainId)}: ${balanceFromDb} !== ${erc20Balance} at block ${syncTask.blockNumber}`
            );
          }
        }
      }
      endTimer(timer);

      logger.info(
        `Balance check: ${matches} matches, ${mismatches} mismatches`,
        {
          matches,
          mismatches,
        }
      );
    },
  });
};

export default checkAddressBalances;
