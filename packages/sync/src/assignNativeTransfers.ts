import { sleep } from '@raylac/shared';
import { getAddress, Hex } from 'viem';
import prisma from './lib/prisma';
import { Prisma } from '@raylac/db';
import { logger } from './utils';

export const assignAddressToTraces = async ({
  chainIds,
  address,
}: {
  chainIds: number[];
  address: Hex;
}) => {
  for (const chainId of chainIds) {
    // Get all traces for the address that don't have a stealth address assigned
    const traces = await prisma.trace.findMany({
      select: {
        from: true,
        to: true,
        traceAddress: true,
        logIndex: true,
        transactionHash: true,
        amount: true,
      },
      where: {
        chainId,
        OR: [
          {
            AND: {
              from: address,
              fromStealthAddress: null,
            },
          },
          {
            AND: {
              to: address,
              toStealthAddress: null,
            },
          },
        ],
      },
    });

    for (const trace of traces) {
      const to = getAddress(trace.to);
      const from = getAddress(trace.from);
      const traceAddress = trace.traceAddress;
      const logIndex = trace.logIndex;

      if (traceAddress === null && logIndex === null) {
        throw new Error(
          `Trace of tx ${trace.transactionHash} has no trace address or log index`
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
          where:
            traceAddress !== null
              ? {
                  transactionHash_traceAddress: {
                    transactionHash: trace.transactionHash,
                    traceAddress,
                  },
                }
              : {
                  transactionHash_logIndex: {
                    transactionHash: trace.transactionHash,
                    logIndex: logIndex!,
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

const assignNativeTransfers = async ({ chainIds }: { chainIds: number[] }) => {
  while (true) {
    try {
      const userStealthAddresses = await prisma.userStealthAddress.findMany({
        select: {
          address: true,
        },
      });

      const batchSize = 20;

      for (let i = 0; i < userStealthAddresses.length; i += batchSize) {
        const batch = userStealthAddresses.slice(i, i + batchSize);

        await Promise.all(
          batch.map(address =>
            assignAddressToTraces({
              address: address.address as Hex,
              chainIds,
            })
          )
        );
      }
    } catch (err) {
      logger.error(err);
    }

    await sleep(1000); // Sleep for 2 seconds
  }
};

export default assignNativeTransfers;
