import { getMnemonic, getSpendingPrivKey, getViewingPrivKey } from '@/lib/key';
import { trpc } from '@/lib/trpc';
import { publicClient } from '@/lib/viem';
import { RouterOutput } from '@/types';
import {
  USDC_CONTRACT_ADDRESS,
  ERC20Abi,
  encodePaymasterAndData,
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
  const { mutateAsync: send } = trpc.send.useMutation();
  const { mutateAsync: buildStealthTransfer } =
    trpc.buildStealthTransfer.useMutation();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      toUserId,
    }: {
      amount: bigint;
      toUserId: number;
    }) => {
      const stealthTransferData = await buildStealthTransfer({
        amount: amount.toString(),
        toUserId,
      });

      // Recover the private keys of the inputs specified in "stealthTransferData".

      const mnemonic = await getMnemonic();
      const viewPrivKey = await getViewingPrivKey(mnemonic);
      const spendingPrivKey = await getSpendingPrivKey(mnemonic);

      if (!viewPrivKey) {
        throw new Error('No view key found');
      }

      if (!spendingPrivKey) {
        throw new Error('No spending key found');
      }

      const signatures = await Promise.all(
        stealthTransferData.inputs.map(async input => {
          const transferCall = encodeFunctionData({
            abi: ERC20Abi,
            functionName: 'transfer',
            args: [stealthTransferData.to.address, input.amount],
          });

          const stealthPrivKey = recoveryStealthPrivKey({
            ephemeralPubKey: input.from.ephemeralPubKey,
            viewingPrivKey: viewPrivKey as Hex,
            spendingPrivKey: spendingPrivKey as Hex,
          });

          const sig = await signMessage({
            privateKey: stealthPrivKey,
            message: {
              raw: transferCall,
            },
          });

          return sig;
        })
      );

      await send({
        signatures,
        stealthTransferData: stealthTransferData,
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
