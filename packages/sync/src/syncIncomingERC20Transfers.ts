import { bigIntMin, getPublicClient, getTraceId } from '@raylac/shared';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { getAddress, Hex, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';
import {
  getLatestBlockHeight,
  getMinSynchedBlockForAddresses,
  updateAddressesSyncStatus,
} from './utils';
import logger from './lib/logger';
import { Prisma } from '@prisma/client';

const batchSyncIncomingERC20Transfers = async ({
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

  const logs = await publicClient.getLogs({
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

  for (const log of logs) {
    // TODO: User the `upsertTranasction` function
    await prisma.transaction.upsert({
      create: {
        hash: log.transactionHash,
        chainId,
        block: {
          connectOrCreate: {
            create: {
              number: log.blockNumber,
              hash: log.blockHash,
              chainId,
            },
            where: {
              hash: log.blockHash,
            },
          },
        },
      },
      update: {},
      where: {
        hash: log.transactionHash,
      },
    });

    const traceId = getTraceId({
      txHash: log.transactionHash,
      traceAddress: log.logIndex,
    });

    const transferId = traceId;

    const data: Prisma.TransferCreateInput = {
      transferId,
      maxBlockNumber: log.blockNumber,
    };

    const fromAddress = getAddress(log.args.from!);
    const toAddress = getAddress(log.args.to!);

    const fromUser = await prisma.userStealthAddress.findUnique({
      select: {
        userId: true,
      },
      where: {
        address: fromAddress,
      },
    });

    const toUser = await prisma.userStealthAddress.findUnique({
      select: {
        userId: true,
      },
      where: {
        address: toAddress,
      },
    });

    if (fromUser) {
      data.fromUser = {
        connect: {
          id: fromUser.userId,
        },
      };
    } else {
      data.fromAddress = fromAddress;
    }

    if (toUser) {
      data.toUser = {
        connect: {
          id: toUser.userId,
        },
      };
    } else {
      data.toAddress = toAddress;
    }

    await prisma.transfer.upsert({
      create: data,
      update: data,
      where: {
        transferId,
      },
    });

    const traceUpsertArgs: Prisma.TraceCreateInput = {
      id: traceId,
      tokenId,
      from: fromAddress,
      to: toAddress,
      amount: BigInt(log.args.value!),
      Transfer: {
        connect: {
          transferId,
        },
      },
      Transaction: {
        connect: {
          hash: log.transactionHash,
        },
      },
    };

    await prisma.trace.upsert({
      create: traceUpsertArgs,
      update: traceUpsertArgs,
      where: {
        id: traceId,
      },
    });
  }
};

const syncERC20Transfers = async () => {
  const erc20Tokens = supportedTokens.filter(token => token.tokenId !== 'eth');

  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: { address: true },
    });

    for (const token of erc20Tokens) {
      for (const { chain } of token.addresses) {
        const chainId = chain.id;
        const client = getPublicClient({ chainId });

        const finalizedBlockNumber = await client.getBlock({
          blockTag: 'finalized',
        });

        // Sync incoming transfers in 100 address batches
        for (let i = 0; i < addresses.length; i += 100) {
          const batch = addresses
            .slice(i, i + 100)
            .map(({ address }) => address as Hex);

          const minSynchedBlockInBatch = await getMinSynchedBlockForAddresses({
            tokenId: token.tokenId,
            addresses: batch,
            chainId,
          });

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

          const chunkSize = BigInt(10000);
          for (
            let fromBlock = _fromBlock;
            fromBlock < latestBlock;
            fromBlock += chunkSize
          ) {
            const toBlock = bigIntMin([fromBlock + chunkSize, latestBlock]);

            await batchSyncIncomingERC20Transfers({
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
      }
    }

    await sleep(5 * 1000); // Sleep for 10 seconds
  }
};

export default syncERC20Transfers;
