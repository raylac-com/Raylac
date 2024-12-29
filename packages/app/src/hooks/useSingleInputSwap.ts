import { trpc } from '@/lib/trpc';
import {
  GetSingleInputSwapQuoteReturnType,
  SubmitSingleInputSwapRequestBody,
} from '@raylac/shared/out/rpcTypes';
import { signEIP1159Tx, sleep } from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import useUserAccount from './useUserAccount';
import { privateKeyToAccount } from 'viem/accounts';
import { getPrivateKey } from '@/lib/key';

const useSingleInputSwap = () => {
  const queryClient = useQueryClient();
  const { data: userAccount } = useUserAccount();

  const { mutateAsync: submitSingleInputSwap } =
    trpc.submitSingleInputSwap.useMutation();

  return useMutation({
    mutationFn: async ({
      swapQuote,
    }: {
      swapQuote: GetSingleInputSwapQuoteReturnType;
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

      const signedApproveTx = swapQuote.approveStep
        ? await signEIP1159Tx({
            tx: swapQuote.approveStep.tx,
            account,
          })
        : null;

      const signedSwapTx = await signEIP1159Tx({
        tx: swapQuote.swapStep.tx,
        account,
      });

      const requestBody: SubmitSingleInputSwapRequestBody = {
        signedApproveStep:
          swapQuote.approveStep && signedApproveTx
            ? { ...swapQuote.approveStep, signature: signedApproveTx }
            : null,
        signedSwapStep: {
          ...swapQuote.swapStep,
          signature: signedSwapTx,
        },
      };

      await submitSingleInputSwap(requestBody);

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });
    },
  });
};

export default useSingleInputSwap;
