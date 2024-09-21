import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getUserIdFromToken } from './auth';
import prisma from './lib/prisma';

export async function createContext(opts: CreateNextContextOptions) {
  const token = opts.req.headers['authorization']?.split(' ')[1];

  const userId = token ? getUserIdFromToken(token) : null;

  const user = userId
    ? await prisma.user.findUnique({
        select: {
          devModeEnabled: true,
        },
        where: { id: userId },
      })
    : null;

  const isDevMode = user ? user.devModeEnabled : false;
  console.log('isDevMode', isDevMode);

  return {
    userId,
    isDevMode,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
