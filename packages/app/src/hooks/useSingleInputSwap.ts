import { trpc } from '@/lib/trpc';
import {
  GetSingleInputSwapQuoteReturnType,
  SubmitSingleInputSwapRequestBody,
} from '@raylac/shared/out/rpcTypes';
import { signEIP1159Tx, sleep } from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { privateKeyToAccount } from 'viem/accounts';
import { getPrivateKey } from '@/lib/key';
import { Hex } from 'viem';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';

const useSingleInputSwap = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: submitSingleInputSwap,
    error: submitSingleInputSwapError,
  } = trpc.submitSingleInputSwap.useMutation({
    throwOnError: false,
  });

  useEffect(() => {
    if (submitSingleInputSwapError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: submitSingleInputSwapError.message,
      });
    }
  }, [submitSingleInputSwapError]);

  return useMutation({
    throwOnError: false,
    mutationFn: async ({
      address,
      swapQuote,
    }: {
      address: Hex;
      swapQuote: GetSingleInputSwapQuoteReturnType;
    }) => {
      await sleep(100);

      const privKey = await getPrivateKey(address);

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

      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });
    },
  });
};

export default useSingleInputSwap;
