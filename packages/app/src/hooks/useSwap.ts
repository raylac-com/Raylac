import { trpc } from '@/lib/trpc';
import { GetSwapQuoteReturnType } from '@raylac/shared/out/rpcTypes';
import { sleep } from '@raylac/shared/out/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSignUserOps from './useSignUserOp';
import { UserOperation } from '@raylac/shared';
import { getQueryKey } from '@trpc/react-query';
import useUserAccount from './useUserAccount';

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
      swapQuote,
    }: {
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

      await submitUserOps({
        userOps: signedUserOps,
        swapQuote,
      });

      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getTokenBalances),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(trpc.getSwapHistory),
      });
    },
  });
};

export default useSwap;
