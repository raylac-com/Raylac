import { getSpendingPrivKey, getViewingPrivKey } from '@/lib/key';
import { trpc } from '@/lib/trpc';
import { publicClient } from '@/lib/viem';
import { RouterOutput } from '@/types';
import {
  BASE_SEPOLIA_USDC_CONTRACT,
  ERC20Abi,
  SUTORI_PAYMASTER_ADDRESS,
  buildUserOp,
  encodePaymasterAndData,
  getUserOpHash,
  recoveryStealthPrivKey,
  StealthAccount,
} from '@sutori/shared';
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
  const { data: userStealthAccounts } = trpc.getStealthAccounts.useQuery();
  const { mutateAsync: send } = trpc.send.useMutation();
  const { mutateAsync: signUserOp } = trpc.signUserOp.useMutation();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      to,
      stealthAccount,
    }: {
      amount: bigint;
      to: string;
      stealthAccount?: StealthAccount;
    }) => {
      if (!userStealthAccounts) {
        throw new Error('Stealth addresses not loaded');
      }

      // Sort the stealth accounts by balance
      const sortedStealthAccounts = userStealthAccounts.sort((a, b) =>
        BigInt(b.balance) > BigInt(a.balance) ? 1 : -1
      );

      let currentAmount = BigInt(0);
      const sendFrom: RouterOutput['getStealthAccounts'] = [];

      for (const account of sortedStealthAccounts) {
        sendFrom.push(account);
        currentAmount += BigInt(account.balance);

        if (currentAmount >= amount) {
          break;
        }
      }

      if (currentAmount < amount) {
        throw new Error('Not enough funds');
      }

      const viewPrivKey = await getViewingPrivKey();
      const spendingPrivKey = await getSpendingPrivKey();

      if (!viewPrivKey) {
        throw new Error('No view key found');
      }

      if (!spendingPrivKey) {
        throw new Error('No spending key found');
      }

      let remainingAmount = amount;

      const userOps = await Promise.all(
        sendFrom.map(async account => {
          const accountBalance = BigInt(account.balance);

          const sendAmount =
            remainingAmount > accountBalance ? accountBalance : remainingAmount;

          const transferCall = encodeFunctionData({
            abi: ERC20Abi,
            functionName: 'transfer',
            args: [to as Hex, sendAmount],
          });

          const stealthSigner = publicKeyToAddress(
            account.stealthPubKey as Hex
          );

          const userOp = await buildUserOp({
            client: publicClient,
            stealthSigner,
            value: BigInt(0),
            to: BASE_SEPOLIA_USDC_CONTRACT,
            data: transferCall,
          });

          userOp.paymasterAndData = encodePaymasterAndData({
            paymaster: SUTORI_PAYMASTER_ADDRESS,
            data: await signUserOp({ userOp }),
          });

          remainingAmount -= sendAmount;

          const userOpHash = await getUserOpHash({
            client: publicClient,
            userOp,
          });

          console.log('Signing user op', userOpHash);

          const stealthPrivKey = recoveryStealthPrivKey({
            ephemeralPubKey: account.ephemeralPubKey as Hex,
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

      await send({
        userOps,
        stealthAccount,
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
