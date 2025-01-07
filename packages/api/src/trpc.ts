import * as Sentry from '@sentry/node';
import { initTRPC } from '@trpc/server';
import type { Context } from './context';
import { ZodError } from 'zod';
import { logger } from '@raylac/shared-backend';

const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;

    logger.error(`${error.message}`, {
      shape,
      path: opts.path,
    });
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause?.flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

const sentryMiddleware = t.middleware(
  Sentry.trpcMiddleware({
    attachRpcInput: true,
  })
);

const sentrifiedProcedure = t.procedure.use(sentryMiddleware);
export const publicProcedure = sentrifiedProcedure;
