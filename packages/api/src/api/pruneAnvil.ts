import { anvil } from 'viem/chains';
import prisma from '../lib/prisma';
import { logger } from '@raylac/sync';

const pruneAnvil = async () => {
  await prisma.addressSyncStatus.deleteMany({
    where: {
      chainId: anvil.id,
    },
  });

  await prisma.trace.deleteMany({
    where: {
      chainId: anvil.id,
    },
  });

  await prisma.transaction.deleteMany({
    where: {
      chainId: anvil.id,
    },
  });

  await prisma.block.deleteMany({
    where: {
      chainId: anvil.id,
    },
  });

  await prisma.userOperation.deleteMany({
    where: {
      chainId: anvil.id,
    },
  });

  logger.info('Pruned anvil');
};

export default pruneAnvil;
