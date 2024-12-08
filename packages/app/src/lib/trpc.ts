import {
  createTRPCClient,
  createTRPCReact,
  httpBatchLink,
} from '@trpc/react-query';
import type { AppRouter } from '@raylac/api';
import { getAuthToken } from './auth';

export const trpc = createTRPCReact<AppRouter>();

const EXPO_PUBLIC_RPC_URL = process.env.EXPO_PUBLIC_RPC_URL;

export const getRpcLinks = () => {
  return [
    httpBatchLink({
      url: EXPO_PUBLIC_RPC_URL as string,
      async headers() {
        if (!EXPO_PUBLIC_RPC_URL) {
          throw new Error('Missing EXPO_PUBLIC_RPC_URL');
        }

        const authToken = await getAuthToken();

        if (authToken) {
          return {
            authorization: `Bearer ${authToken}`,
          };
        }

        return {};
      },
    }),
  ];
};

export const getRpcClient = () => {
  return createTRPCClient<AppRouter>({
    links: getRpcLinks(),
  });
};
