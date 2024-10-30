import { useEffect } from 'react';
import useSignedInUser from './useSignedInUser';
import { Hex } from 'viem';
import { trpc } from '@/lib/trpc';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateStealthAddress } from '@raylac/shared';
import { getQueryKey } from '@trpc/react-query';

/**
 * Hook to generate a new deposit account
 */
const useGetNewDepositAccount = () => {
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: addStealthAccount, error } =
    trpc.addStealthAccount.useMutation();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: error.message,
      });
    }
  }, [error]);

  return useMutation({
    mutationFn: async (label: string) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      const account = generateStealthAddress({
        spendingPubKey: signedInUser.spendingPubKey as Hex,
        viewingPubKey: signedInUser.viewingPubKey as Hex,
        accountVersion: 1,
      });

      /// Submit the deposit account to the server
      await addStealthAccount({
        userId: signedInUser.id,
        address: account.address,
        signerAddress: account.signerAddress,
        ephemeralPubKey: account.ephemeralPubKey,
        viewTag: account.viewTag,
        label,
      });

      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getStealthAccounts),
      });
    },
  });
};

export default useGetNewDepositAccount;
