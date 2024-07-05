import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@sutori/api';

export const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://1e6059ef741c.ngrok.app',
      // url: "http://192.168.1.36:3000",
      headers: async () => {
        return {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIyLCJpYXQiOjE3MjAwMTQ5NjR9.I_jyUg-7ZqfLXD9u0vkAqNvoiezZ__jSzw4-AZ8jusw',
        };
      },
    }),
  ],
});

const rpc = async () => {
  const balance = await client.getBalance.query();
  console.log(balance);
};

rpc();
