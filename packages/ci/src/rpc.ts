import { AppRouter } from '@raylac/api';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

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
