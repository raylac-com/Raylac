import { bigIntMin, getPublicClient } from '@raylac/shared';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { Hex, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';
import { getLatestBlockHeight } from './utils';

const syncERC20TransfersForAddresses = async ({
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

  console.log(
    `Syncing ERC20 transfers for ${addresses.length} addresses. ${fromBlock} -> ${toBlock}`
  );

  const incomingTransferLogs = await publicClient.getLogs({
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

  const outgoingTransferLogs = await publicClient.getLogs({
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

  const logs = [...incomingTransferLogs, ...outgoingTransferLogs];

  const txHashes = logs.map(log => log.transactionHash);

  for (const txHash of txHashes) {
    const log = logs.find(log => log.transactionHash === txHash);

    if (!log) {
      throw new Error(`log not found for transaction ${txHash}`);
    }

    await prisma.transaction.upsert({
      create: {
        hash: txHash,
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
        hash: txHash,
      },
    });
  }

  await prisma.eRC20TransferLog.createMany({
    data: logs.map(log => {
      return {
        tokenId,
        from: log.args.from!,
        to: log.args.to!,
        amount: BigInt(log.args.value!),
        logIndex: log.logIndex,
        blockNumber: Number(log.blockNumber),
        txIndex: log.transactionIndex,
        chainId,
        transactionHash: log.transactionHash,
      };
    }),
    skipDuplicates: true,
  });
};

const getMinSynchedBlockForAddresses = async ({
  addresses,
  tokenId,
  chainId,
}: {
  addresses: Hex[];
  tokenId: string;
  chainId: number;
}) => {
  const record = await prisma.eRC20TransferLog.findFirst({
    where: {
      to: {
        in: addresses,
      },
      tokenId,
      chainId,
    },
    select: {
      blockNumber: true,
    },
    orderBy: {
      blockNumber: 'asc',
    },
  });

  return record ? BigInt(record.blockNumber) : null;
};

const syncERC20Transfers = async () => {
  const erc20Tokens = supportedTokens.filter(token => token.tokenId !== 'eth');

  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: { address: true },
    });

    for (const token of erc20Tokens) {
      for (const { chain, syncFrom } of token.addresses) {
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

          const minSynchedBlockInBatch =
            (await getMinSynchedBlockForAddresses({
              tokenId: token.tokenId,
              addresses: batch,
              chainId,
            })) || syncFrom;

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

          const chunkSize = BigInt(2000);
          for (
            let fromBlock = _fromBlock;
            fromBlock < latestBlock;
            fromBlock += chunkSize
          ) {
            const toBlock = bigIntMin([fromBlock + chunkSize, latestBlock]);

            await syncERC20TransfersForAddresses({
              addresses: batch,
              fromBlock,
              toBlock,
              chainId,
              tokenId: token.tokenId,
            });
          }
        }
      }
    }

    await sleep(10 * 1000); // Sleep for 10 seconds
  }
};

export default syncERC20Transfers;
