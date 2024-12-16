import { GetSwapQuoteRequestBody, Token } from '@raylac/shared';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import useUserAccount from './useUserAccount';

const useGetSwapQuote = () => {
  const { data: userAccount } = useUserAccount();

  const { mutateAsync: getSwapQuote } = trpc.getSwapQuote.useMutation({
    throwOnError: false,
  });

  return useMutation({
    mutationFn: async ({
      amount,
      inputToken,
      outputToken,
    }: {
      amount: bigint;
      inputToken: Token;
      outputToken: Token;
    }) => {
      if (!userAccount) {
        throw new Error('User address not loaded');
      }

      const requestBody: GetSwapQuoteRequestBody = {
        sender: userAccount.address,
        amount: amount.toString(),
        inputToken,
        outputToken,
      };

      try {
        const quote = await getSwapQuote(requestBody);
        return quote;
      } catch (_error) {
        // Don't throw error
        return null;
      }
    },
  });
};

export default useGetSwapQuote;
