import { decodeEventLog, Log, parseEventLogs } from 'viem';
import { ENTRY_POINT_ADDRESS, UUPSUpgradeableAbi } from '@raylac/shared';
import prisma from './lib/prisma';
import { Prisma } from '@prisma/client';

const handleUpgradeEventLog = async ({
  log,
  chainId,
}: {
  log: Log<bigint, number, false>;
  chainId: number;
}) => {
  const decodedLog = decodeEventLog({
    abi: UUPSUpgradeableAbi,
    data: log.data,
    topics: log.topics,
  });

  if (decodedLog.eventName !== 'Upgraded') {
    throw new Error('Event name is not `Upgraded`');
  }

  const { args } = decodedLog;

  const implementation = args.implementation;

  const data: Prisma.UpgradedCreateInput = {
    chainId,
    newImplementation: implementation,
    logIndex: log.logIndex,
    UserStealthAddress: {
      connect: {
        address: log.address,
      },
    },
    Transaction: {
      connect: {
        hash: log.transactionHash,
      },
    },
  };

  await prisma.upgraded.upsert({
    where: {
      txHash_logIndex: {
        txHash: log.transactionHash,
        logIndex: log.logIndex,
      },
    },
    update: data,
    create: data,
  });
};

const syncUpgrades = async () => {
  while (true) {
    const userOpTxs = await prisma.transaction.findMany({
      select: {
        hash: true,
        chainId: true,
        logs: true,
      },
      where: {
        toAddress: ENTRY_POINT_ADDRESS,
      },
    });

    for (const tx of userOpTxs) {
      const upgradeLogs = parseEventLogs({
        abi: UUPSUpgradeableAbi,
        eventName: 'Upgraded',
        logs: JSON.parse(tx.logs as string) as Log[],
      });

      for (const log of upgradeLogs) {
        await handleUpgradeEventLog({ log, chainId: tx.chainId });
      }
    }
  }
};

export default syncUpgrades;
