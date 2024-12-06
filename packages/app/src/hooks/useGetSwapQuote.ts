import {
  GetSwapQuoteRequestBody,
  TokenBalancesReturnType,
} from '@raylac/shared/out/rpcTypes';
import { hexToBigInt, toHex } from 'viem';
import { SupportedTokensReturnType } from '@raylac/shared/out/rpcTypes';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import useUserAddress from './useUserAddress';
import { buildSwapIo } from '@raylac/shared/out/utils';

const useGetSwapQuote = () => {
  const { data: userAddress } = useUserAddress();

  const { mutateAsync: getSwapQuote } = trpc.getSwapQuote.useMutation({
    throwOnError: false,
  });

  return useMutation({
    mutationFn: async ({
      amount,
      inputToken,
      outputToken,
      inputTokenBalance,
    }: {
      amount: bigint;
      inputToken: SupportedTokensReturnType[number];
      outputToken: SupportedTokensReturnType[number];
      inputTokenBalance: TokenBalancesReturnType[number];
    }) => {
      if (!userAddress) {
        throw new Error('User address not loaded');
      }

      const hasEnoughBalance = hexToBigInt(inputTokenBalance.balance) >= amount;

      let inputs, output;
      if (hasEnoughBalance) {
        const swapIo = buildSwapIo({
          inputToken,
          outputToken,
          amount,
          inputTokenBalance,
        });

        inputs = swapIo.inputs;
        output = swapIo.output;
      } else {
        inputs = [
          {
            tokenAddress: inputToken.addresses[0].address,
            amount,
            chainId: inputToken.addresses[0].chainId,
          },
        ];

        // TODO: Choose the best output token
        output = {
          tokenAddress: outputToken.addresses[0].address,
          chainId: outputToken.addresses[0].chainId,
        };
      }

      const requestBody: GetSwapQuoteRequestBody = {
        senderAddress: userAddress,
        inputs: inputs.map(input => ({
          ...input,
          amount: toHex(input.amount),
        })),
        output,
        tradeType: 'EXACT_INPUT',
      };

      return getSwapQuote(requestBody);
    },
  });
};

export default useGetSwapQuote;
