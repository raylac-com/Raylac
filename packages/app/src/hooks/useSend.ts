import { getMnemonic } from '@/lib/key';
import { client, trpc } from '@/lib/trpc';
import { User } from '@/types';
import {
  ChainGasInfo,
  StealthAddressWithEphemeral,
  buildMultiChainSendRequestBody,
  generateStealthAddress,
  getSpendingPrivKey,
  getTokenAddressOnChain,
  getViewingPrivKey,
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

  return useMutation({
    mutationFn: async ({
      amount,
      tokenId,
      outputChainId,
      recipientUserOrAddress,
      gasInfo,
    }: {
      amount: bigint;
      tokenId: string;
      outputChainId: number;
      recipientUserOrAddress: Hex | User;
      gasInfo: ChainGasInfo[];
    }) => {
      const addressBalancePerChain =
        await client.getAddressBalancesPerChain.query();

      const stealthAccounts = await client.getStealthAccounts.query();

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
        stealthAccountsWithTokenBalances: addressBalancePerChain.map(
          account => ({
            tokenId: account.tokenId!,
            balance: account.balance!,
            chainId: account.chainId!,
            tokenAddress: getTokenAddressOnChain({
              chainId: account.chainId,
              tokenId,
            }),
            stealthAddress: stealthAccounts.find(
              stealthAccount => stealthAccount.address === account.address
            ) as StealthAddressWithEphemeral,
            nonce: account.nonce,
          })
        ),
        outputChainId,
        gasInfo,
      });

      await submitUserOps({
        userOps,
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
