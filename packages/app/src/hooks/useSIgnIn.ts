import { saveAuthToken } from '@/lib/auth';
import { trpc } from '@/lib/trpc';
import { setSignedInUser } from '@/lib/utils';
import userKeys from '@/queryKeys/userKeys';
import {
  buildSiweMessage,
  getPublicClient,
  getSpendingPrivKey,
} from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

export const useSignIn = () => {
  const { mutateAsync: signIn } = trpc.signIn.useMutation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mnemonic }: { mnemonic: string }) => {
      const spendingAccount = privateKeyToAccount(
        await getSpendingPrivKey(mnemonic)
      );

      const issuedAt = new Date();

      const publicClient = getPublicClient({
        chainId: mainnet.id,
      });

      const message = buildSiweMessage({
        issuedAt,
        address: spendingAccount.address,
        chainId: publicClient.chain.id,
      });

      console.log('message', message);

      // Sign in and get the JWT token
      const { userId, token } = await signIn({
        issuedAt: issuedAt.toISOString(),
        userSpendingPubKey: spendingAccount.publicKey,
        signature: await spendingAccount.signMessage({
          message,
        }),
      });

      await setSignedInUser(userId);
      await saveAuthToken(token);

      await queryClient.invalidateQueries({
        queryKey: userKeys.isSignedIn,
      });
      await queryClient.invalidateQueries({
        queryKey: userKeys.signedInUser,
      });
    },
  });
};
