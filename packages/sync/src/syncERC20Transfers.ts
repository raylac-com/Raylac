import { bigIntMin, ERC20Abi, getPublicClient, sleep } from '@raylac/shared';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { decodeEventLog, getAddress, Hex, Log, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import {
  getLatestBlockHeight,
  getMinSynchedBlockForAddresses,
  updateAddressesSyncStatus,
  upsertTransaction,
} from './utils';
import { logger } from './utils';
import { Prisma } from '@prisma/client';
import deployAccount from './lib/deployAccount';

export const handleERC20TransferLog = async ({
  log,
  tokenId,
  chainId,
  tokenPrice,
}: {
  log: Log<bigint, number, false>;
  tokenId: string;
  chainId: number;
  tokenPrice?: number;
}) => {
  const decodedLog = decodeEventLog({
    abi: ERC20Abi,
    data: log.data,
    topics: log.topics,
  });

  if (decodedLog.eventName !== 'Transfer') {
    throw new Error('Event name is not `Transfer`');
  }

  const { args } = decodedLog;

  const from = getAddress(args.from);
  const to = getAddress(args.to);

  await upsertTransaction({
    txHash: log.transactionHash,
    chainId,
  });

  const data: Prisma.TraceCreateInput = {
    from,
    to,
    tokenId,
    amount: args.value.toString(),
    logIndex: log.logIndex,
    Transaction: {
      connect: {
        hash: log.transactionHash,
      },
    },
    tokenPriceAtTrace: tokenPrice ?? null,
    chainId,
  };

  const toUserExists = await prisma.userStealthAddress.findUnique({
    where: { address: to },
  });

  if (toUserExists) {
    data.UserStealthAddressTo = { connect: { address: to } };
  }

  const fromUserExists = await prisma.userStealthAddress.findUnique({
    where: { address: from },
  });

  if (fromUserExists) {
    data.UserStealthAddressFrom = { connect: { address: from } };
  }

  await prisma.trace.upsert({
    create: data,
    update: data,
    where: {
      transactionHash_logIndex: {
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
      },
    },
  });
};

const batchSyncERC20Transfers = async ({
  addresses,
  fromBlock,
  toBlock,
  chainId,
  tokenId,
}: {
  addresses: Hex[];
  fromBlock: bigint;
  toBlock: bigint;
  chainId: number;
  tokenId: string;
}) => {
  const token = supportedTokens.find(token => token.tokenId === tokenId);

  if (!token) {
    throw new Error(`Token not found for token id ${tokenId}`);
  }

  const tokenAddress = token.addresses.find(
    address => address.chain.id === chainId
  );

  if (!tokenAddress) {
    throw new Error(`Token not found for chain ${chainId}`);
  }

  const publicClient = getPublicClient({
    chainId,
  });

  logger.info(
    `Syncing ERC20 transfers for ${addresses.length} addresses. ${fromBlock} -> ${toBlock} on chain ${chainId}`
  );

  const incomingLogs = await publicClient.getLogs({
    address: tokenAddress.address,
    event: parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ),
    args: {
      to: addresses,
    },
    fromBlock,
    toBlock,
  });

  const outgoingLogs = await publicClient.getLogs({
    address: tokenAddress.address,
    event: parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ),
    args: {
      from: addresses,
    },
    fromBlock,
    toBlock,
  });

  for (const log of [...incomingLogs, ...outgoingLogs]) {
    await handleERC20TransferLog({ log, tokenId, chainId });

    // Deploy the account that received the transfer if it's not already deployed
    const to = getAddress(log.args.to!);
    await deployAccount({ address: to, chainId });
  }
};

const syncERC20Transfers = async () => {
  const erc20Tokens = supportedTokens.filter(token => token.tokenId !== 'eth');

  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: { address: true },
    });

    for (const token of erc20Tokens) {
      await Promise.all(
        token.addresses.map(async ({ chain }) => {
          const chainId = chain.id;
          const client = getPublicClient({ chainId });

          const finalizedBlockNumber = await client.getBlock({
            blockTag: 'finalized',
          });

          // Sync erc20 transfers in 100 address batches
          for (let i = 0; i < addresses.length; i += 100) {
            const batch = addresses
              .slice(i, i + 100)
              .map(({ address }) => address as Hex);

            const minSynchedBlockInBatch = await getMinSynchedBlockForAddresses(
              {
                tokenId: token.tokenId,
                addresses: batch,
                chainId,
              }
            );

            if (!minSynchedBlockInBatch) {
              throw new Error(
                `No min synched block found for token ${token.tokenId}`
              );
            }

            const _fromBlock = bigIntMin([
              minSynchedBlockInBatch,
              finalizedBlockNumber.number,
            ]);

            const latestBlock = await getLatestBlockHeight(chainId);

            if (!latestBlock) {
              // No blocks have been synced yet
              continue;
            }

            const chunkSize = BigInt(10000);
            for (
              let fromBlock = _fromBlock;
              fromBlock < latestBlock;
              fromBlock += chunkSize
            ) {
              const toBlock = bigIntMin([fromBlock + chunkSize, latestBlock]);

              await batchSyncERC20Transfers({
                addresses: batch,
                fromBlock,
                toBlock,
                chainId,
                tokenId: token.tokenId,
              });

              await updateAddressesSyncStatus({
                addresses: batch,
                chainId,
                tokenId: token.tokenId,
                blockNum: toBlock,
              });
            }
          }
        })
      );
    }

    await sleep(5 * 1000); // Sleep for 10 seconds
  }
};

export default syncERC20Transfers;
