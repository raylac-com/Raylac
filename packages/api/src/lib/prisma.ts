import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient().$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      const start = Date.now();
      /* your custom logic for modifying all Prisma Client operations here */

      const result = await query(args);

      const duration = Date.now() - start;

      logger.info(`Query on ${model} took ${duration}ms`, {
        model,
        operation,
        duration,
      });

      return result;
    },
  },
});

export default prisma;
