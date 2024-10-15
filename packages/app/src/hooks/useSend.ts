import { getMnemonic } from '@/lib/key';
import { trpc } from '@/lib/trpc';
import { User } from '@/types';
import {
  AddressTokenBalance,
  ChainGasInfo,
  RAYLAC_PAYMASTER_ADDRESS,
  StealthAddressWithEphemeral,
  buildMultiChainSendRequestBody,
  encodePaymasterAndData,
  generateStealthAddress,
  getSpendingPrivKey,
  getViewingPrivKey,
  signUserOpWithStealthAccount,
} from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
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
  const { mutateAsync: submitUserOps } = trpc.submitUserOps.useMutation();

  const { mutateAsync: addNewStealthAccount } =
    trpc.addStealthAccount.useMutation();

  const queryClient = useQueryClient();

  const { mutateAsync: paymasterSignUserOp } =
    trpc.paymasterSignUserOp.useMutation();

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
    }: {
      amount: bigint;
      tokenId: string;
      chainId: number;
      recipientUserOrAddress: Hex | User;
      gasInfo: ChainGasInfo[];
      addressBalancesPerChain: AddressTokenBalance[];
      stealthAddresses: StealthAddressWithEphemeral[];
      addressNonces: Record<Hex, number | null>;
    }) => {
      const mnemonic = await getMnemonic();

      const viewingPrivKey = await getViewingPrivKey(mnemonic);

      const spendingPrivKey = await getSpendingPrivKey(mnemonic);

      if (!viewingPrivKey) {
        throw new Error('No view key found');
      }

      if (!spendingPrivKey) {
        throw new Error('No spending key found');
      }

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
        const paymasterAndData = encodePaymasterAndData({
          paymaster: RAYLAC_PAYMASTER_ADDRESS,
          data: await paymasterSignUserOp({ userOp }),
        });
        userOp.paymasterAndData = paymasterAndData;

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
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTxHistory),
      });
      queryClient.invalidateQueries({
        queryKey: ['tokenBalances'],
      });
    },
  });
};

export default useSend;
