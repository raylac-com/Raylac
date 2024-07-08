import { useEffect } from 'react';
import useGenerateStealthAccount from './useGenerateStealthAccount';
import useSignedInUser from './useSignedInUser';
import { Hex } from 'viem';
import { trpc } from '@/lib/trpc';
import Toast from 'react-native-toast-message';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook to generate a new deposit account
 */
const useGetNewDepositAccount = () => {
  const { mutateAsync: generateStealthAccount } = useGenerateStealthAccount();
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: addStealthAccount, error } = trpc.addStealthAccount.useMutation();

  useEffect(() => {
    if (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: error.message,
      });
    }
  }, [error]);

  return useMutation({
    mutationFn: async () => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      const account = await generateStealthAccount({
        spendingPubKey: signedInUser.spendingPubKey as Hex,
        viewingPubKey: signedInUser.viewingPubKey as Hex,
      });

      /// Submit the deposit account to the server
      await addStealthAccount({
        address: account.address,
        stealthPubKey: account.stealthPubKey,
        ephemeralPubKey: account.ephemeralPubKey,
        viewTag: account.viewTag,
      });

      return account;
    },
  });
};

export default useGetNewDepositAccount;
