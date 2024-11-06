import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@raylac/api';
import { buildSiweMessage } from '@raylac/shared';
import { TEST_ACCOUNT_MNEMONIC } from './auth';
import { getSpendingPrivKey } from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

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

const signInAsTestUser = async () => {
  const spendingPrivKey = await getSpendingPrivKey(TEST_ACCOUNT_MNEMONIC);

  // Sign the SIWE message
  const spendingAccount = privateKeyToAccount(spendingPrivKey);
  const issuedAt = new Date();

  const message = buildSiweMessage({
    issuedAt,
    address: spendingAccount.address,
    chainId: mainnet.id,
  });

  // Sign in and get the JWT token
  const { userId, token } = await client.signIn.mutate({
    issuedAt: issuedAt.toISOString(),
    userSpendingPubKey: spendingAccount.publicKey,
    signature: await spendingAccount.signMessage({
      message,
    }),
  });

  return { userId, token };
};

let token: string;
let testUserId: number;

export const getTestUserId = async () => {
  if (!testUserId) {
    const { userId } = await signInAsTestUser();
    testUserId = userId;
  }

  return testUserId;
};

export const getAuthedClient = async () => {
  if (!token) {
    const { token: _token, userId } = await signInAsTestUser();
    token = _token;
    testUserId = userId;
  }

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
