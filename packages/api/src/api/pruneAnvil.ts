import prisma from '../lib/prisma';
import { logger } from '@raylac/shared-backend';
import { devChains } from '@raylac/shared';

const devChainIds = devChains.map(c => c.id);

const pruneAnvil = async () => {
  await prisma.addressSyncStatus.deleteMany({
    where: {
      chainId: {
        in: devChainIds,
      },
    },
  });

  await prisma.trace.deleteMany({
    where: {
      chainId: {
        in: devChainIds,
      },
    },
  });

  const devChainTxs = await prisma.transaction.findMany({
    select: {
      hash: true,
    },
    where: {
      chainId: {
        in: devChainIds,
      },
    },
  });

  await prisma.transaction.deleteMany({
    where: {
      chainId: {
        in: devChainIds,
      },
    },
  });

  await prisma.block.deleteMany({
    where: {
      chainId: {
        in: devChainIds,
      },
    },
  });

  await prisma.userOperation.deleteMany({
    where: {
      chainId: {
        in: devChainIds,
      },
    },
  });

  await prisma.userAction.deleteMany({
    where: {
      txHashes: {
        hasSome: devChainTxs.map(tx => tx.hash),
      },
    },
  });

  logger.info('Pruned anvil');
};

export default pruneAnvil;
