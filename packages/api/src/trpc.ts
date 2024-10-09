import { initTRPC } from '@trpc/server';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

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
