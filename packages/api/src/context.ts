import * as trpcNext from '@trpc/server/adapters/next';
import { getUserIdFromToken } from './auth';

export async function createContext({
  req,
}: trpcNext.CreateNextContextOptions) {
  const token = req.headers['authorization']?.split(' ')[1];

  const userId = token ? getUserIdFromToken(token) : null;

  return {
    userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
