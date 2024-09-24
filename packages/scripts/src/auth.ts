import { buildSiweMessage, getSpendingPrivKey } from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { client } from './rpc';

export const signInWithMnemonic = async ({
  mnemonic,
}: {
  mnemonic: string;
}) => {
  const spendingPrivKey = await getSpendingPrivKey(mnemonic);

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
