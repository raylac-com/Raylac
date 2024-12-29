import { trpc } from '@/lib/trpc';
import {
  GetSwapQuoteReturnType,
  SubmitSwapRequestBody,
} from '@raylac/shared/out/rpcTypes';
import {
  SignedCrossChainSwapStep,
  signEIP1159Tx,
  sleep,
  Token,
} from '@raylac/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import useUserAccount from './useUserAccount';
import { privateKeyToAccount } from 'viem/accounts';
import { getPrivateKey, getUserAddresses } from '@/lib/key';

const useSwap = () => {
  const queryClient = useQueryClient();
  const { data: userAccount } = useUserAccount();

  const { mutateAsync: submitSwap } = trpc.submitSwap.useMutation();

  return useMutation({
    mutationFn: async ({
      swapQuote,
      inputToken,
      outputToken,
    }: {
      swapQuote: GetSwapQuoteReturnType;
      inputToken: Token;
      outputToken: Token;
    }) => {
      await sleep(100);

      if (!userAccount) {
        throw new Error('User account not loaded');
      }

      const addresses = await getUserAddresses();
      const privKey = await getPrivateKey(addresses[0]);

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

      const submitSwapRequestBody: SubmitSwapRequestBody = {
        sender: userAccount.address,
        signedSwapSteps: signedCrossChainSwapSteps,
        amountIn: swapQuote.amountIn,
        amountOut: swapQuote.amountOut,
        amountInUsd: swapQuote.amountInUsd,
        amountOutUsd: swapQuote.amountOutUsd,
        tokenIn: inputToken,
        tokenOut: outputToken,
        relayerServiceFeeAmount: swapQuote.relayerServiceFeeAmount,
        relayerServiceFeeUsd: swapQuote.relayerServiceFeeUsd,
      };

      await submitSwap(submitSwapRequestBody);

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getSetBalances),
      });
    },
  });
};

export default useSwap;
