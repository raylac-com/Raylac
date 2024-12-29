import { GetSingleInputSwapQuoteRequestBody, Token } from '@raylac/shared';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import useUserAccount from './useUserAccount';

const useGetSwapQuote = () => {
  const { data: userAccount } = useUserAccount();

  const { mutateAsync: getSingleInputSwapQuote } =
    trpc.getSingleInputSwapQuote.useMutation({
      throwOnError: false,
    });

  return useMutation({
    mutationFn: async ({
      amount,
      inputToken,
      outputToken,
      inputChainId,
      outputChainId,
    }: {
      amount: bigint;
      inputToken: Token;
      outputToken: Token;
      inputChainId: number;
      outputChainId: number;
    }) => {
      if (!userAccount) {
        throw new Error('User address not loaded');
      }

      const requestBody: GetSingleInputSwapQuoteRequestBody = {
        sender: userAccount.address,
        amount: amount.toString(),
        inputToken,
        outputToken,
        inputChainId,
        outputChainId,
      };

      try {
        const quote = await getSingleInputSwapQuote(requestBody);
        return quote;
      } catch (_error) {
        // Don't throw error
        return null;
      }
    },
  });
};

export default useGetSwapQuote;
