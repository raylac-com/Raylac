import { getMnemonicAndKeys } from '@/lib/key';
import { trpc } from '@/lib/trpc';
import { getPaymasterAndData } from '@/lib/utils';
import { User } from '@/types';
import {
  AddressTokenBalance,
  ChainGasInfo,
  StealthAddressWithEphemeral,
  buildMultiChainSendRequestBody,
  generateStealthAddress,
  signUserOpWithStealthAccount,
} from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { Hex } from 'viem';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

/**
 * Hook to build and send user operations
 */
const useSend = () => {
  const { mutateAsync: submitUserOps, error } =
    trpc.submitUserOps.useMutation();

  const { mutateAsync: addNewStealthAccount } =
    trpc.addStealthAccount.useMutation();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (error) {
      Toast.show({
        text1: 'Error',
        text2: error.message,
        type: 'error',
      });
    }
  }, [error]);

  return useMutation({
    mutationFn: async ({
      amount,
      tokenId,
      chainId,
      recipientUserOrAddress,
      addressBalancesPerChain,
      stealthAddresses,
      addressNonces,
      gasInfo,
      tokenPrice,
    }: {
      amount: bigint;
      tokenId: string;
      chainId: number;
      recipientUserOrAddress: Hex | User;
      gasInfo: ChainGasInfo[];
      addressBalancesPerChain: AddressTokenBalance[];
      stealthAddresses: StealthAddressWithEphemeral[];
      addressNonces: Record<Hex, number | null>;
      tokenPrice: number;
    }) => {
      const { viewingPrivKey, spendingPrivKey } = await getMnemonicAndKeys();

      const to =
        typeof recipientUserOrAddress === 'string'
          ? recipientUserOrAddress
          : generateStealthAddress({
              spendingPubKey: recipientUserOrAddress.spendingPubKey as Hex,
              viewingPubKey: recipientUserOrAddress.viewingPubKey as Hex,
            });

      if (typeof to !== 'string') {
        await addNewStealthAccount({
          userId: (recipientUserOrAddress as User).id,
          address: to.address,
          signerAddress: to.signerAddress,
          ephemeralPubKey: to.ephemeralPubKey,
          viewTag: to.viewTag,
          label: '',
        });
      }

      const toAddress = typeof to === 'string' ? to : to.address;

      const userOps = await buildMultiChainSendRequestBody({
        amount,
        tokenId,
        to: toAddress,
        addressTokenBalances: addressBalancesPerChain,
        stealthAddresses,
        addressNonces,
        chainId,
        gasInfo,
      });

      const signedUserOps = [];
      for (const userOp of userOps) {
        userOp.paymasterAndData = await getPaymasterAndData(userOp);

        const stealthAccount = stealthAddresses.find(
          stealthAddress => stealthAddress.address === userOp.sender
        ) as StealthAddressWithEphemeral;

        if (!stealthAccount) {
          throw new Error('Stealth account not found');
        }

        // Sign the user operation with the stealth account
        const signedUserOp = await signUserOpWithStealthAccount({
          userOp,
          stealthAccount,
          spendingPrivKey,
          viewingPrivKey,
        });

        signedUserOps.push(signedUserOp);
      }

      await submitUserOps({
        userOps: signedUserOps,
        tokenPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTransferHistory),
      });
      queryClient.invalidateQueries({
        queryKey: ['tokenBalances'],
      });
    },
  });
};

export default useSend;
