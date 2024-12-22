import { trpc } from '@/lib/trpc';
import { GetSwapQuoteReturnType } from '@raylac/shared/out/rpcTypes';
import { SignedCrossChainSwapStep, signEIP1159Tx, sleep } from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import useUserAccount from './useUserAccount';
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

      const privKey = await getPrivateKey();

      if (!privKey) {
        throw new Error('Private key not found');
      }

      const account = privateKeyToAccount(privKey);

      const signedCrossChainSwapSteps: SignedCrossChainSwapStep[] = [];

      for (const step of swapQuote.swapSteps) {
        const signedTx = await signEIP1159Tx({
          tx: step.tx,
          account,
        });

        signedCrossChainSwapSteps.push({
          ...step,
          signature: signedTx,
        });
      }

      await submitSwap({
        swapQuote,
        signedCrossChainSwapSteps,
      });

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getStakedBalance),
      });

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getETHBalance),
      });
    },
  });
};

export default useSwap;
