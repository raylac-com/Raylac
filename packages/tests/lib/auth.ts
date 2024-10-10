import { buildSiweMessage } from '@raylac/shared';

import { getSpendingPrivKey } from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { client } from './rpc';

export const MNEMONIC = process.env.TEST_ACCOUNT_MNEMONIC as string;

if (!MNEMONIC) {
  throw new Error('MNEMONIC not found');
}

export const signInAsTestUser = async () => {
  const spendingPrivKey = await getSpendingPrivKey(MNEMONIC);

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
