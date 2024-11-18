import prisma from '../lib/prisma';
import { logger } from '@raylac/shared-backend';
import { devChains } from '@raylac/shared';

const devChainIds = devChains.map(c => c.id);

const pruneAnvil = async () => {
  await prisma.$transaction(async tx => {
    await tx.syncTask.deleteMany({
      where: {
        chainId: {
          in: devChainIds,
        },
      },
    });

    await tx.trace.deleteMany({
      where: {
        chainId: {
          in: devChainIds,
        },
      },
    });

    const devChainTxs = await tx.transaction.findMany({
      select: {
        hash: true,
      },
      where: {
        chainId: {
          in: devChainIds,
        },
      },
    });

    await tx.transaction.deleteMany({
      where: {
        chainId: {
          in: devChainIds,
        },
      },
    });

    await tx.block.deleteMany({
      where: {
        chainId: {
          in: devChainIds,
        },
      },
    });

    await tx.userOperation.deleteMany({
      where: {
        chainId: {
          in: devChainIds,
        },
      },
    });

    await tx.userAction.deleteMany({
      where: {
        txHashes: {
          hasSome: devChainTxs.map(tx => tx.hash),
        },
      },
    });
  });

  logger.info('Pruned anvil');
};

export default pruneAnvil;
