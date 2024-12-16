import { trpc } from '@/lib/trpc';
import { GetSwapQuoteReturnType } from '@raylac/shared/out/rpcTypes';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPublicClient } from '@raylac/shared';
import { getQueryKey } from '@trpc/react-query';
import useUserAccount from './useUserAccount';
import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getPrivateKey } from '@/lib/key';

const useSwap = () => {
  const queryClient = useQueryClient();
  const { data: userAccount } = useUserAccount();

  const { mutateAsync: submitSwap } = trpc.submitSwap.useMutation();

  return useMutation({
    mutationFn: async ({
      swapQuote,
    }: {
      swapQuote: GetSwapQuoteReturnType;
    }) => {
      await sleep(100);

      if (!userAccount) {
        throw new Error('User account not loaded');
      }

      const chains = new Set(
        swapQuote.steps.flatMap(step =>
          step.items.flatMap(item => item.data.chainId)
        )
      );

      const privKey = await getPrivateKey();

      if (!privKey) {
        throw new Error('Private key not found');
      }

      const account = privateKeyToAccount(privKey);

      // Get nonces for all chains
      const nonces: Record<number, number> = {};

      for (const chainId of chains) {
        const publicClient = getPublicClient({ chainId });
        // eslint-disable-next-line security/detect-object-injection
        nonces[chainId] = await publicClient.getTransactionCount({
          address: account.address,
        });
      }

      const singedTxs: {
        chainId: number;
        signedTx: Hex;
        sender: Hex;
      }[] = [];

      for (const step of swapQuote.steps) {
        for (const item of step.items) {
          const gas = item.data.gas ? BigInt(item.data.gas) : BigInt(500_000);

          const signedTx = await account.signTransaction({
            chainId: item.data.chainId,
            maxFeePerGas: BigInt(item.data.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(item.data.maxPriorityFeePerGas),
            gas,
            to: item.data.to,
            value: BigInt(item.data.value),
            data: item.data.data,
            nonce: nonces[item.data.chainId],
          });

          nonces[item.data.chainId]++;

          singedTxs.push({
            chainId: item.data.chainId,
            signedTx,
            sender: account.address,
          });
        }
      }

      await submitSwap({
        swapQuote,
        signedTxs: singedTxs,
      });

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getHistory),
      });
    },
  });
};

export default useSwap;
