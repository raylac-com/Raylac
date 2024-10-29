import { getPublicClient, sleep } from '@raylac/shared';
import { getAddress, Hex, toBytes, toHex } from 'viem';
import prisma from './lib/prisma';
import { Prisma } from '@prisma/client';
import supportedChains from '@raylac/shared/out/supportedChains';
import { logger, upsertTransaction } from './utils';
import { getTokenPriceAtTime } from './lib/coingecko';

/**
 * Get the timestamp of a block from the database
 */
const getBlockTimestamp = async ({
  blockNumber,
  chainId,
}: {
  blockNumber: bigint;
  chainId: number;
}) => {
  const client = getPublicClient({ chainId });

  const block = await client.getBlock({
    blockNumber,
  });

  if (!block) {
    throw new Error(`Block ${blockNumber} not found on chain ${chainId}`);
  }

  return block.timestamp;
};

/**
 * Get the latest trace assigned to an address
 */
const getLatestAssignedTraceBlockNumber = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const trace = await prisma.trace.findFirst({
    select: {
      Transaction: {
        select: {
          block: {
            select: {
              number: true,
            },
          },
        },
      },
    },
    where: {
      chainId,
      OR: [{ from: address }, { to: address }],
    },
    orderBy: {
      Transaction: {
        block: {
          number: 'desc',
        },
      },
    },
  });

  return trace?.Transaction.block.number;
};

export const assignAddressToTraces = async ({ address }: { address: Hex }) => {
  for (const chain of supportedChains) {
    const chainId = chain.id;

    const addressBytes = toBytes(address);

    const latestAssignedTraceBlockNumber =
      await getLatestAssignedTraceBlockNumber({
        address,
        chainId,
      });

    const nativeTransferTraces = await prisma.nativeTransferTrace.findMany({
      select: {
        from: true,
        to: true,
        traceAddress: true,
        transactionHash: true,
        blockNumber: true,
        amount: true,
      },
      where: {
        chainId,
        OR: [
          { from: Buffer.from(addressBytes) },
          { to: Buffer.from(addressBytes) },
        ],
        blockNumber: {
          gt: latestAssignedTraceBlockNumber || 0,
        },
      },
    });

    for (const trace of nativeTransferTraces) {
      const to = getAddress(toHex(trace.to));
      const from = getAddress(toHex(trace.from));
      const traceAddress = trace.traceAddress;

      if (!traceAddress) {
        throw new Error(
          `Trace of tx ${trace.transactionHash} has no trace address`
        );
      }

      // Upsert the transaction and the block
      await upsertTransaction({
        txHash: trace.transactionHash as Hex,
        chainId,
      });

      const data: Prisma.TraceCreateInput = {
        from,
        to,
        amount: trace.amount,
        tokenId: 'eth',
        chainId,
        Transaction: {
          connect: {
            hash: trace.transactionHash,
          },
        },
        traceAddress: trace.traceAddress,
      };

      if (to === address) {
        data.UserStealthAddressTo = { connect: { address: to } };
      }

      if (from === address) {
        data.UserStealthAddressFrom = { connect: { address: from } };
      }

      const blockTimestamp = await getBlockTimestamp({
        blockNumber: trace.blockNumber,
        chainId,
      });

      const tokenPrice = blockTimestamp
        ? await getTokenPriceAtTime('eth', Number(blockTimestamp))
        : undefined;

      if (tokenPrice) {
        data.tokenPriceAtTrace = tokenPrice;
      }

      await prisma.trace.upsert({
        create: data,
        update: data,
        where: {
          transactionHash_traceAddress: {
            transactionHash: trace.transactionHash,
            traceAddress,
          },
        },
      });

      logger.info(
        `Assigned ${address} to trace ${trace.transactionHash} ${trace.traceAddress}`
      );
    }
  }
};

const assignNativeTransfers = async () => {
  while (true) {
    const userStealthAddresses = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
      },
    });

    const batchSize = 10;

    for (let i = 0; i < userStealthAddresses.length; i += batchSize) {
      const batch = userStealthAddresses.slice(i, i + batchSize);

      await Promise.all(
        batch.map(address =>
          assignAddressToTraces({
            address: address.address as Hex,
          })
        )
      );
    }

    await sleep(5000); // Sleep for 5 seconds
  }
};

export default assignNativeTransfers;
