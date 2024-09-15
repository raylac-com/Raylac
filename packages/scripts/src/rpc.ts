import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@raylac/api';

const url = 'http://localhost:3000';

export const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url,
      /*
      headers: async () => {
        return {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIyLCJpYXQiOjE3MjAwMTQ5NjR9.I_jyUg-7ZqfLXD9u0vkAqNvoiezZ__jSzw4-AZ8jusw',
        };
      },
      */
    }),
  ],
});

export const getAuthedClient = (token: string) => {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
        headers: async () => {
          return {
            authorization: `Bearer ${token}`,
          };
        },
      }),
    ],
  });
};
