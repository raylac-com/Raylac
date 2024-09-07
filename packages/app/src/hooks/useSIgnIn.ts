import { initAccountFromMnemonic } from '@/lib/account';
import { saveAuthToken } from '@/lib/auth';
import { trpc } from '@/lib/trpc';
import { saveSignedInUser } from '@/lib/utils';
import { publicClient } from '@/lib/viem';
import userKeys from '@/queryKeys/userKeys';
import { buildSiweMessage } from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publicKeyToAddress } from 'viem/accounts';

export const useSignIn = () => {
  const { mutateAsync: signIn } = trpc.signIn.useMutation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mnemonic }: { mnemonic: string }) => {
      const { spendingAccount } = await initAccountFromMnemonic(mnemonic);

      // Sign the SIWE message
      const spendingAddress = publicKeyToAddress(spendingAccount.publicKey);
      const issuedAt = new Date();

      const message = buildSiweMessage({
        issuedAt,
        address: spendingAddress,
        chainId: publicClient.chain.id,
      });

      // Sign in and get the JWT token
      const { userId, token } = await signIn({
        issuedAt: issuedAt.toISOString(),
        userSpendingPubKey: spendingAccount.publicKey,
        signature: await spendingAccount.signMessage({
          message,
        }),
      });

      await saveSignedInUser(userId);
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
