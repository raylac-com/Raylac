import { GetSwapQuoteRequestBody } from '@raylac/shared/out/rpcTypes';
import { hexToBigInt, toHex, zeroAddress } from 'viem';
import { SupportedTokensReturnType } from '@raylac/shared/out/rpcTypes';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import useUserAccount from './useUserAccount';
import { buildSwapIo } from '@raylac/shared/out/utils';
import { SwapInput, SwapOutput } from '@raylac/shared/out/types';

const useGetSwapQuote = () => {
  const { data: userAccount } = useUserAccount();

  const { mutateAsync: getSwapQuote } = trpc.getSwapQuote.useMutation({
    throwOnError: false,
  });

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      address: userAccount?.address ?? zeroAddress,
    },
    { enabled: !!userAccount }
  );

  return useMutation({
    mutationFn: async ({
      amount,
      inputToken,
      outputToken,
    }: {
      amount: bigint;
      inputToken: SupportedTokensReturnType[number];
      outputToken: SupportedTokensReturnType[number];
    }) => {
      if (!userAccount) {
        throw new Error('User address not loaded');
      }

      if (tokenBalances === undefined) {
        throw new Error('Token balances not loaded');
      }

      const inputTokenBalance = tokenBalances.find(balance => {
        return balance.breakdown.find(breakdown => {
          return inputToken.addresses.some(
            address =>
              address.address === breakdown.tokenAddress &&
              address.chainId === breakdown.chainId
          );
        });
      });

      const hasEnoughBalance =
        inputTokenBalance === undefined
          ? false
          : hexToBigInt(inputTokenBalance.balance) >= amount;

      let inputs: SwapInput[];
      let output: SwapOutput;
      if (hasEnoughBalance) {
        const swapIo = buildSwapIo({
          inputToken,
          outputToken,
          amount,
          inputTokenBalance: inputTokenBalance!,
        });

        inputs = swapIo.inputs;
        output = swapIo.output;
      } else {
        inputs = [
          {
            token: inputToken,
            amount,
            chainId: inputToken.addresses[0].chainId,
          },
        ];

        // TODO: Choose the best output token
        output = {
          token: outputToken,
          chainId: outputToken.addresses[0].chainId,
        };
      }

      const requestBody: GetSwapQuoteRequestBody = {
        senderAddress: userAccount.address,
        inputs: inputs.map(input => ({
          ...input,
          amount: toHex(input.amount),
        })),
        output,
        tradeType: 'EXACT_INPUT',
      };

      try {
        const quote = await getSwapQuote(requestBody);
        return { quote, inputs, output };
      } catch (_error) {
        // Don't throw error
        return null;
      }
    },
  });
};

export default useGetSwapQuote;
