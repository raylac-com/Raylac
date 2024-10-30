import { sleep } from '@raylac/shared';
import { getAddress, Hex } from 'viem';
import prisma from './lib/prisma';
import { Prisma } from '@prisma/client';
import supportedChains from '@raylac/shared/out/supportedChains';
import { logger } from './utils';

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
      OR: [{ toStealthAddress: address }, { fromStealthAddress: address }],
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

    const latestAssignedTraceBlockNumber =
      await getLatestAssignedTraceBlockNumber({
        address,
        chainId,
      });

    const traces = await prisma.trace.findMany({
      select: {
        from: true,
        to: true,
        traceAddress: true,
        transactionHash: true,
        amount: true,
      },
      where: {
        chainId,
        OR: [{ from: address }, { to: address }],
        Transaction: {
          block: {
            number: {
              gt: latestAssignedTraceBlockNumber || 0,
            },
          },
        },
      },
    });

    for (const trace of traces) {
      const to = getAddress(trace.to);
      const from = getAddress(trace.from);
      const traceAddress = trace.traceAddress;

      if (traceAddress === null) {
        throw new Error(
          `Trace of tx ${trace.transactionHash} has no trace address`
        );
      }

      const data: Prisma.TraceUpdateInput = {};

      if (to === address) {
        data.UserStealthAddressTo = { connect: { address: to } };
      }

      if (from === address) {
        data.UserStealthAddressFrom = { connect: { address: from } };
      }

      if (data.UserStealthAddressFrom || data.UserStealthAddressTo) {
        await prisma.trace.update({
          data,
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
  }
};

const assignNativeTransfers = async () => {
  while (true) {
    try {
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
    } catch (err) {
      logger.error(err);
    }

    await sleep(5000); // Sleep for 5 seconds
  }
};

export default assignNativeTransfers;
