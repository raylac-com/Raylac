import { getMnemonic } from '@/lib/key';
import { client, trpc } from '@/lib/trpc';
import { RouterOutput, User } from '@/types';
import {
  RAYLAC_PAYMASTER_ADDRESS,
  StealthAddressWithEphemeral,
  UserOperation,
  buildMultiChainSendRequestBody,
  bulkSignUserOps,
  encodePaymasterAndData,
  generateStealthAddress,
  getSpendingPrivKey,
  getTokenAddressOnChain,
  getViewingPrivKey,
  signUserOpWithStealthAccount,
} from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { useCallback } from 'react';
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
  const { mutateAsync: send } = trpc.send.useMutation();
  const { mutateAsync: signUserOp } = trpc.signUserOp.useMutation();
  const { data: signedInUser } = useSignedInUser();

  const queryClient = useQueryClient();

  /**
   * Get the `paymasterAndData` field for a user operation
   */
  const getPaymasterAndData = useCallback(
    async ({ userOp }: { userOp: UserOperation }) => {
      const paymasterSig = encodePaymasterAndData({
        paymaster: RAYLAC_PAYMASTER_ADDRESS,
        data: await signUserOp({ userOp }),
      });

      return {
        ...userOp,
        paymasterAndData: paymasterSig,
      };
    },
    [signUserOp]
  );

  return useMutation({
    mutationFn: async ({
      amount,
      tokenId,
      outputChainId,
      recipientUserOrAddress,
    }: {
      amount: bigint;
      tokenId: string;
      outputChainId: number;
      recipientUserOrAddress: Hex | User;
    }) => {
      const addressBalancePerChain =
        await client.getAddressBalancesPerChain.query();

      const stealthAccounts = await client.getStealthAccounts.query();

      // Get addresses with the specified token balance
      const sortedAccountsWithToken = addressBalancePerChain
        .filter(balance => balance.tokenId)
        .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

      let currentAmount = BigInt(0);
      const sendFromAccounts: RouterOutput['getTokenBalancesPerChain'] = [];

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

      const mnemonic = await getMnemonic(signedInUser.id);
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

      const toAddress = typeof to === 'string' ? to : to.address;

      console.log(`Sending ${amount} ${tokenId} to ${toAddress}`);
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
          })
        ),

        outputChainId,
      });

      /**
       * 2. Get the paymaster signatures for the user operations
       */

      console.log(`Getting paymaster signatures...`);
      const paymasterSignedBridgeUserOps = await Promise.all(
        multiChainSendData.aggregationUserOps.map(async userOp => {
          return getPaymasterAndData({ userOp });
        })
      );

      const paymasterSignedFinalTransferUserOp = await getPaymasterAndData({
        userOp: multiChainSendData.finalTransferUserOp,
      });

      console.log(`Signing bridge user ops...`);
      const signedBridgeUserOps = await bulkSignUserOps({
        userOps: paymasterSignedBridgeUserOps,
        stealthAccounts: stealthAccounts as StealthAddressWithEphemeral[],
        spendingPrivKey,
        viewingPrivKey,
      });

      console.log(`Signing final transfer user op...`);
      const signedFinalTransferUserOp = await signUserOpWithStealthAccount({
        userOp: paymasterSignedFinalTransferUserOp,
        stealthAccount: multiChainSendData.consolidateToStealthAccount,
        spendingPrivKey,
        viewingPrivKey,
      });

      await send({
        aggregationUserOps: signedBridgeUserOps,
        finalTransferUserOp: signedFinalTransferUserOp,
        relayQuotes: multiChainSendData.relayQuotes,
        proxyStealthAccount: multiChainSendData.consolidateToStealthAccount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalancesPerChain),
      });
    },
  });
};

export default useSend;
