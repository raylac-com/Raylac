import { GetSingleInputSwapQuoteRequestBody, Token } from '@raylac/shared';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { Hex } from 'viem';

const useGetSwapQuote = () => {
  const { mutateAsync: getSingleInputSwapQuote } =
    trpc.getSingleInputSwapQuote.useMutation({
      throwOnError: false,
    });

  return useMutation({
    mutationFn: async ({
      address,
      amount,
      inputToken,
      outputToken,
      inputChainId,
      outputChainId,
    }: {
      address: Hex;
      amount: bigint;
      inputToken: Token;
      outputToken: Token;
      inputChainId: number;
      outputChainId: number;
    }) => {
      const requestBody: GetSingleInputSwapQuoteRequestBody = {
        sender: address,
        amount: amount.toString(),
        inputToken,
        outputToken,
        inputChainId,
        outputChainId,
      };

      const quote = await getSingleInputSwapQuote(requestBody);

      return quote;
    },
  });
};

export default useGetSwapQuote;
