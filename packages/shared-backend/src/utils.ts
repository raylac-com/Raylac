import { Prisma } from '@raylac/db';
import { logger } from './logger';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const safeUpsert = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.message.includes('Unique constraint failed')) {
        logger.info('Unique constraint failed, retrying...');
        await sleep(Math.random() * 1000);
        return await fn();
      }
    }

    throw e;
  }
};
