import {
  GetSwapQuoteRequestBody,
  TokenBalancesReturnType,
} from '@raylac/shared/out/rpcTypes';
import { hexToBigInt, toHex } from 'viem';
import { SupportedTokensReturnType } from '@raylac/shared/out/rpcTypes';
import { useMutation } from '@tanstack/react-query';
import { parseUnits } from 'viem';
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
      amount: string;
      inputToken: SupportedTokensReturnType[number];
      outputToken: SupportedTokensReturnType[number];
      inputTokenBalance: TokenBalancesReturnType[number];
    }) => {
      const parsedAmount = toHex(parseUnits(amount, inputToken.decimals));

      if (parsedAmount === '0x0') {
        return;
      }

      const hasEnoughBalance =
        hexToBigInt(inputTokenBalance.balance) >= BigInt(parsedAmount);

      let inputs, output;
      if (hasEnoughBalance) {
        const swapIo = buildSwapIo({
          inputToken,
          outputToken,
          amount: BigInt(parsedAmount),
          inputTokenBalance,
        });

        inputs = swapIo.inputs;
        output = swapIo.output;
      } else {
        inputs = [
          {
            tokenAddress: inputToken.addresses[0].address,
            amount: BigInt(parsedAmount),
            chainId: inputToken.addresses[0].chainId,
          },
        ];

        // TODO: Choose the best output token
        output = {
          tokenAddress: outputToken.addresses[0].address,
          amount: parsedAmount,
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
