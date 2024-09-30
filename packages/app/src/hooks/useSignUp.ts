import { privateKeyToAccount } from 'viem/accounts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { Buffer } from 'buffer';
import * as bip39 from 'bip39';
import userKeys from '@/queryKeys/userKeys';
import { saveMnemonic } from '@/lib/key';
import { saveAuthToken } from '@/lib/auth';
import { setSignedInUser } from '@/lib/utils';
import { getSpendingPrivKey, getViewingPrivKey } from '@raylac/shared';

globalThis.Buffer = Buffer;

const useSignUp = () => {
  const { mutateAsync: signUp } = trpc.signUp.useMutation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      username,
    }: {
      name: string;
      username: string;
    }) => {
      const mnemonic = bip39.generateMnemonic();

      const spendingPubKey = privateKeyToAccount(
        getSpendingPrivKey(mnemonic)
      ).publicKey;
      const viewingPrivKey = getViewingPrivKey(mnemonic);

      const { userId, token } = await signUp({
        name,
        username,
        spendingPubKey,
        viewingPrivKey,
      });

      await saveMnemonic(mnemonic);
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

export default useSignUp;
