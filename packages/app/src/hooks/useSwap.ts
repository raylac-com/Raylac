import { trpc } from '@/lib/trpc';
import {
  GetSwapQuoteReturnType,
  SubmitUserOpsRequestBody,
} from '@raylac/shared/out/rpcTypes';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSignUserOps from './useSignUserOp';
import { Token, UserOperation } from '@raylac/shared';
import { getQueryKey } from '@trpc/react-query';
import useUserAccount from './useUserAccount';
import { toHex } from 'viem';

const useSwap = () => {
  const queryClient = useQueryClient();
  const { data: userAccount } = useUserAccount();

  const { mutateAsync: buildSwapUserOp } = trpc.buildSwapUserOp.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: submitUserOps } = trpc.submitUserOps.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: signUserOps } = useSignUserOps();

  return useMutation({
    mutationFn: async ({
      inputs,
      output,
      swapQuote,
    }: {
      inputs: { chainId: number; token: Token; amount: bigint }[];
      output: { chainId: number; token: Token };
      swapQuote: GetSwapQuoteReturnType;
    }) => {
      await sleep(100);

      if (!userAccount) {
        throw new Error('User account not loaded');
      }

      const userOps = await buildSwapUserOp({
        singerAddress: userAccount.singerAddress,
        quote: swapQuote,
      });

      const signedUserOps = await signUserOps(userOps as UserOperation[]);

      const submitUserOpsPayload: SubmitUserOpsRequestBody = {
        userOps: signedUserOps,
        inputs: inputs.map(input => ({
          ...input,
          amount: toHex(input.amount),
        })),
        output,
        swapQuote,
      };

      await submitUserOps(submitUserOpsPayload);

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });

      await queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getSwapHistory),
      });
    },
  });
};

export default useSwap;
