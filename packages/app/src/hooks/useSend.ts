import { getMnemonic, getSpendingPrivKey, getViewingPrivKey } from '@/lib/key';
import { trpc } from '@/lib/trpc';
import { publicClient } from '@/lib/viem';
import { RouterOutput, User } from '@/types';
import {
  ERC20Abi,
  NATIVE_TOKEN_ADDRESS,
  RAYLAC_PAYMASTER_ADDRESS,
  UserOperation,
  buildUserOp,
  encodePaymasterAndData,
  generateStealthAddress,
  getUserOpHash,
  recoveryStealthPrivKey,
} from '@raylac/shared';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { Hex, encodeFunctionData } from 'viem';
import { publicKeyToAddress, signMessage } from 'viem/accounts';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

/**
 * Hook to build and send user operations
 */
const useSend = () => {
  const { data: tokenBalancePerChain } =
    trpc.getTokenBalancesPerChain.useQuery();
  const { mutateAsync: send } = trpc.send.useMutation();
  const { mutateAsync: signUserOp } = trpc.signUserOp.useMutation();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      inputTokenId,
      outputTokenId,
      recipientUserOrAddress,
    }: {
      amount: bigint;
      inputTokenId: string;
      outputTokenId: string;
      recipientUserOrAddress: Hex | User;
    }) => {
      if (!tokenBalancePerChain) {
        throw new Error('Token balances not loaded');
      }

      // Get addresses with the specified token balance
      const sortedAccountsWithToken = tokenBalancePerChain
        .filter(balance => balance.tokenId)
        .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

      let currentAmount = BigInt(0);
      const sendFrom: RouterOutput['getTokenBalancesPerChain'] = [];

      for (const account of sortedAccountsWithToken) {
        sendFrom.push(account);
        currentAmount += BigInt(account.balance);

        if (currentAmount >= amount) {
          break;
        }
      }

      if (currentAmount < amount) {
        throw new Error('Not enough funds');
      }

      const mnemonic = await getMnemonic();
      const viewPrivKey = await getViewingPrivKey(mnemonic);
      const spendingPrivKey = await getSpendingPrivKey(mnemonic);

      if (!viewPrivKey) {
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

      let remainingAmount = amount;

      const userOps = await Promise.all(
        sendFrom.map(async account => {
          const accountBalance = BigInt(account.balance);

          const sendAmount =
            remainingAmount > accountBalance ? accountBalance : remainingAmount;

          const stealthSigner = publicKeyToAddress(
            account.stealthAddress.stealthPubKey as Hex
          );

          const inputTokenData = supportedTokens
            .find(token => token.tokenId === inputTokenId)
            ?.addresses.find(
              tokenAddress => tokenAddress.chain.id === account.chain.id
            );

          let userOp: UserOperation;
          if (inputTokenData.address === NATIVE_TOKEN_ADDRESS) {
            userOp = await buildUserOp({
              client: publicClient,
              stealthSigner,
              value: sendAmount,
              to: toAddress,
              data: '0x',
            });
          } else {
            const transferCall = encodeFunctionData({
              abi: ERC20Abi,
              functionName: 'transfer',
              args: [toAddress, sendAmount],
            });

            userOp = await buildUserOp({
              client: publicClient,
              stealthSigner,
              value: BigInt(0),
              to: inputTokenData.address,
              data: transferCall,
            });
          }

          userOp.paymasterAndData = encodePaymasterAndData({
            paymaster: RAYLAC_PAYMASTER_ADDRESS,
            data: await signUserOp({ userOp }),
          });

          remainingAmount -= sendAmount;

          const userOpHash = await getUserOpHash({
            client: publicClient,
            userOp,
          });

          const stealthPrivKey = recoveryStealthPrivKey({
            ephemeralPubKey: account.stealthAddress.ephemeralPubKey as Hex,
            viewingPrivKey: viewPrivKey as Hex,
            spendingPrivKey: spendingPrivKey as Hex,
          });

          const sig = await signMessage({
            privateKey: stealthPrivKey,
            message: {
              raw: userOpHash,
            },
          });

          userOp.signature = sig;

          return userOp;
        })
      );

      // TODO: Publish the Stealth address ephemeral data if this is a transfer to a stealth address

      await send({
        userOps,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getBalance),
      });
    },
  });
};

export default useSend;
