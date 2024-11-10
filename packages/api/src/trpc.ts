import { initTRPC } from '@trpc/server';
import type { Context } from './context';
import { logger } from '@raylac/shared-backend';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    logger.error('TRPC error', { shape, error });

    return {
      ...shape,
      data: {
        ...shape.data,
        error: error.message,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// procedure that asserts that the user is logged in
export const authedProcedure = t.procedure.use(async opts => {
  const { ctx } = opts;

  if (!ctx.userId) {
    throw new Error('User not logged in');
  }

  return opts.next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
