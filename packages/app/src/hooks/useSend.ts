import { getMnemonic } from '@/lib/key';
import { client, trpc } from '@/lib/trpc';
import { RouterOutput, User } from '@/types';
import {
  ChainGasInfo,
  StealthAddressWithEphemeral,
  buildMultiChainSendRequestBody,
  generateStealthAddress,
  getSpendingPrivKey,
  getTokenAddressOnChain,
  getViewingPrivKey,
  sleep,
} from '@raylac/shared';
import useSubmitUserOpWithRetry from '@/hooks/useSubmitUserOpWithRetry';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { Hex } from 'viem';
import useSignedInUser from './useSignedInUser';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

/**
 * Hook to build and send user operations
 */
const useSend = () => {
  const { data: signedInUser } = useSignedInUser();

  //  const { mutateAsync: submitUserOp } = trpc.submitUserOperation.useMutation();
  const { mutateAsync: submitUserOpWithRetry } = useSubmitUserOpWithRetry();

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

      // Get addresses with the specified token balance
      const sortedAccountsWithToken = addressBalancePerChain
        .filter(balance => balance.tokenId)
        .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

      let currentAmount = BigInt(0);
      const sendFromAccounts: RouterOutput['getAddressBalancesPerChain'] = [];

      for (const account of sortedAccountsWithToken) {
        sendFromAccounts.push(account);
        currentAmount += BigInt(account.balance);

        if (currentAmount >= amount) {
          break;
        }
      }

      if (currentAmount < amount) {
        throw new Error('Not enough funds');
      }

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
          stealthPubKey: to.stealthPubKey,
          ephemeralPubKey: to.ephemeralPubKey,
          viewTag: to.viewTag,
          label: '',
        });
      }

      const toAddress = typeof to === 'string' ? to : to.address;

      const multiChainSendData = await buildMultiChainSendRequestBody({
        senderPubKeys: {
          spendingPubKey: signedInUser.spendingPubKey as Hex,
          viewingPubKey: signedInUser.viewingPubKey as Hex,
        },
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

      // Save the proxy stealth account to the database
      const proxyAccount = multiChainSendData.consolidateToStealthAccount;

      if (proxyAccount) {
        await addNewStealthAccount({
          userId: signedInUser.id,
          address: proxyAccount.address,
          stealthPubKey: proxyAccount.stealthPubKey,
          ephemeralPubKey: proxyAccount.ephemeralPubKey,
          viewTag: proxyAccount.viewTag,
          label: '',
        });
      }

      // Submit the user operations
      for (const aggregationUserOp of multiChainSendData.aggregationUserOps) {
        const signerAccount = stealthAccounts.find(
          account => account.address === aggregationUserOp.sender
        );

        if (!signerAccount) {
          throw new Error('Signer account not found');
        }

        await submitUserOpWithRetry({
          userOp: aggregationUserOp,
          stealthAccount: signerAccount as StealthAddressWithEphemeral,
          spendingPrivKey,
          viewingPrivKey,
        });
      }

      if (multiChainSendData.finalTransferUserOp) {
        // wait for the balance to be updated
        await sleep(2000);

        const finalUserOpSigner =
          multiChainSendData.consolidateToStealthAccount;

        await submitUserOpWithRetry({
          userOp: multiChainSendData.finalTransferUserOp,
          stealthAccount: finalUserOpSigner as StealthAddressWithEphemeral,
          spendingPrivKey,
          viewingPrivKey,
        });
      }
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
