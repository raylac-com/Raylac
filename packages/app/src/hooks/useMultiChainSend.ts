import { getMnemonicAndKeys } from '@/lib/key';
import { trpc } from '@/lib/trpc';
import { User } from '@/types';
import {
  ERC5564_ANNOUNCEMENT_CHAIN,
  StealthAddressWithEphemeral,
  UserOperation,
  generateStealthAddressV2,
  signUserOpWithStealthAccount,
  supportedChains,
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
const useMultiChainSend = () => {
  const { mutateAsync: submitUserOps, error } =
    trpc.submitUserOps.useMutation();

  const { mutateAsync: addNewStealthAccount } =
    trpc.addStealthAccount.useMutation();

  const { mutateAsync: buildMultiChainSendUserOps } =
    trpc.buildMultiChainSendUserOps.useMutation();

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
      recipientUserOrAddress,
      tokenPrice,
    }: {
      amount: bigint;
      tokenId: string;
      chainId: number;
      recipientUserOrAddress: Hex | User;
      tokenPrice: number;
    }) => {
      const { viewingPrivKey, spendingPrivKey } = await getMnemonicAndKeys();

      const to =
        typeof recipientUserOrAddress === 'string'
          ? recipientUserOrAddress
          : generateStealthAddressV2({
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
          syncOnChainIds: supportedChains.map(chain => chain.id),
          announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
        });
      }

      const toAddress = typeof to === 'string' ? to : to.address;

      // Choose the stealth accounts to use as inputs for the transfer
      const result = await buildMultiChainSendUserOps({
        amount: amount.toString(),
        tokenId,
        to: toAddress,
      });

      const signedUserOps = [];
      for (const { userOp, stealthAccount } of result) {
        // Sign the user operation with the stealth account
        const signedUserOp = await signUserOpWithStealthAccount({
          userOp: userOp as UserOperation,
          stealthAccount: stealthAccount as StealthAddressWithEphemeral,
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

export default useMultiChainSend;
