import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@raylac/api';

const RPC_URL = process.env.RPC_URL;

if (!RPC_URL) {
  throw new Error('RPC_URL not found');
}

export const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: RPC_URL,
    }),
  ],
});

export const getAuthedClient = (token: string) => {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: RPC_URL,
        headers: async () => {
          return {
            authorization: `Bearer ${token}`,
          };
        },
      }),
    ],
  });
};
