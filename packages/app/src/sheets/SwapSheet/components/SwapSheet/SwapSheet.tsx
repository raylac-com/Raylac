import { useEffect, useState } from 'react';
import { Button, View } from 'react-native';
import SwapInputCard from '../SwapInputCard/SwapInputCard';
import SwapOutputCard from '../SwapOutputCard/SwapOutputCard';
import { trpc } from '@/lib/trpc';
import { formatUnits, hexToBigInt, parseUnits, toHex } from 'viem';
import useUserAddress from '@/hooks/useUserAddress';
import {
  buildSwapIo,
  GetSwapQuoteRequestBody,
  supportedChains,
  SupportedTokensReturnType,
  TokenBalancesReturnType,
  TRPCErrorMessage,
  UserOperation,
} from '@raylac/shared';
import ActionSheet from 'react-native-actions-sheet';
import useSignUserOps from '@/hooks/useSignUserOp';
import { getSignerAccount } from '@/lib/key';

type Token = SupportedTokensReturnType[number];

const Swap = () => {
  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');

  const { data: userAddress } = useUserAddress();

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      address: userAddress,
    },
    {
      enabled: !!userAddress,
    }
  );

  const { data: supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

  useEffect(() => {
    if (supportedTokens) {
      setInputToken(supportedTokens[0] as Token);
      setOutputToken(supportedTokens[1] as Token);
    }
  }, [supportedTokens]);

  const {
    mutate: getSwapQuote,
    error: getSwapQuoteError,
    data: swapQuote,
  } = trpc.getSwapQuote.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: buildSwapUserOp } = trpc.buildSwapUserOp.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: submitUserOps } = trpc.submitUserOps.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: signUserOps } = useSignUserOps();

  useEffect(() => {
    if (getSwapQuoteError) {
      alert(getSwapQuoteError.message);
    }
  }, [getSwapQuoteError]);

  useEffect(() => {
    if (userAddress && amount && inputToken && outputToken) {
      const parsedAmount = toHex(parseUnits(amount, inputToken.decimals));

      if (parsedAmount === '0x0') {
        return;
      }

      const tokenBalance = tokenBalances?.find(token =>
        token.breakdown?.some(breakdown =>
          inputToken.addresses.some(
            address =>
              breakdown.tokenAddress === address.address &&
              address.chainId === breakdown.chainId
          )
        )
      );

      const hasEnoughBalance =
        tokenBalance &&
        hexToBigInt(tokenBalance.balance) >= BigInt(parsedAmount);

      let inputs, output;
      if (hasEnoughBalance) {
        const swapIo = buildSwapIo({
          inputToken,
          outputToken,
          amount: BigInt(parsedAmount),
          tokenBalances: tokenBalances as TokenBalancesReturnType,
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

      getSwapQuote(requestBody);
    }
  }, [inputToken, userAddress, outputToken, amount, getSwapQuote]);

  const onInputAmountChange = (amount: string) => {
    setAmount(amount);
  };

  const onSwapPress = async () => {
    if (swapQuote) {
      const singerAddress = await getSignerAccount();
      const userOps = await buildSwapUserOp({
        singerAddress: singerAddress.address,
        quote: swapQuote,
      });

      const signedUserOps = await signUserOps(userOps as UserOperation[]);

      await submitUserOps(signedUserOps);
    }
  };

  const inputTokenBalance = tokenBalances?.find(token =>
    token.breakdown?.some(breakdown =>
      inputToken?.addresses.some(
        address =>
          breakdown.tokenAddress === address.address &&
          address.chainId === breakdown.chainId
      )
    )
  )?.balance;

  const inputAmount = inputToken
    ? parseUnits(amount, inputToken.decimals)
    : null;

  const inputAmountFormatted = inputAmount
    ? formatUnits(BigInt(inputAmount), inputToken.decimals)
    : null;

  const outputAmount = swapQuote?.details?.currencyOut?.amount;

  const outputAmountFormatted = outputAmount
    ? formatUnits(BigInt(outputAmount), outputToken.decimals)
    : null;

  const isAmountTooSmall =
    getSwapQuoteError?.message === TRPCErrorMessage.SWAP_AMOUNT_TOO_SMALL;

  return (
    <ActionSheet
      id="swap-sheet"
      containerStyle={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
    >
      <View
        style={{
          flexDirection: 'column',
          paddingVertical: 20,
          paddingHorizontal: 16,
          rowGap: 16,
        }}
      >
        <SwapInputCard
          token={inputToken}
          setToken={setInputToken}
          amount={inputAmountFormatted}
          setAmount={onInputAmountChange}
          balance={inputTokenBalance ? hexToBigInt(inputTokenBalance) : null}
        />
        <SwapOutputCard
          token={outputToken}
          setToken={setOutputToken}
          amount={outputAmountFormatted}
          setAmount={() => {}}
        />
        {/**
         * Show quote
         */}
        <Button
          title={isAmountTooSmall ? 'Amount too small' : 'Swap'}
          onPress={onSwapPress}
        />
      </View>
    </ActionSheet>
  );
};

export default Swap;
