import { useEffect, useState } from 'react';
import SwapInputCard from './components/SwapInputCard/SwapInputCard';
import SwapOutputCard from './components/SwapOutputCard/SwapOutputCard';
import { trpc } from '@/lib/trpc';
import { formatUnits, getAddress, parseUnits, zeroAddress } from 'viem';
import useUserAccount from '@/hooks/useUserAccount';
import {
  supportedChains,
  SupportedTokensReturnType,
  TRPCErrorMessage,
} from '@raylac/shared';
import StyledButton from '@/components/StyledButton/StyledButton';
import useGetSwapQuote from '@/hooks/useGetSwapQuote';
import useSwap from '@/hooks/useSwap';
import useDebounce from '@/hooks/useDebounce';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import useTokenBalance from '@/hooks/useTokenBalance';
import { View } from 'react-native';
import { SearchTokenSheetProvider } from '@/contexts/SearchInputTokenSheetContext';
import { SearchOutputTokenSheetProvider } from '@/contexts/SearchOutputTokenSheetContext';

type Token = SupportedTokensReturnType[number];

const Swap = () => {
  const navigation = useTypedNavigation();

  //
  // Local State
  //

  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [amountInputText, setAmountInputText] = useState<string>('');

  const { data: userAccount } = useUserAccount();

  //
  // Fetch data
  //

  const { data: inputTokenBalance } = useTokenBalance(inputToken);

  const { data: tokenBalances, isLoading: isLoadingTokenBalances } =
    trpc.getTokenBalances.useQuery(
      {
        address: userAccount?.address ?? zeroAddress,
      },
      {
        enabled: !!userAccount,
      }
    );

  const { data: supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

  // Mutations

  const {
    mutate: getSwapQuote,
    data: swapQuote,
    isPending: isGettingSwapQuote,
    error: getSwapQuoteError,
  } = useGetSwapQuote();

  const { mutateAsync: swap, isPending: isSwapping } = useSwap();

  //
  // Effects
  //

  useEffect(() => {
    if (supportedTokens) {
      if (tokenBalances && tokenBalances.length > 0) {
        const inputToken = supportedTokens?.find(token =>
          token.addresses.some(
            tokenAddress =>
              getAddress(tokenAddress.address) ===
              getAddress(tokenBalances[0].breakdown[0].tokenAddress)
          )
        );

        if (inputToken) {
          setInputToken(inputToken as Token);
        }
      }

      if (tokenBalances && tokenBalances.length > 1) {
        const outputToken = supportedTokens?.find(token =>
          token.addresses.some(
            tokenAddress =>
              getAddress(tokenAddress.address) ===
              getAddress(tokenBalances[1].breakdown[0].tokenAddress)
          )
        );

        if (outputToken) {
          setOutputToken(outputToken as Token);
        }
      }
    }
  }, [tokenBalances, supportedTokens]);

  useEffect(() => {
    if (getSwapQuoteError) {
      alert(getSwapQuoteError.message);
    }
  }, [getSwapQuoteError]);

  const parsedInputAmount = inputToken
    ? parseUnits(amountInputText, inputToken.decimals)
    : null;

  const { debouncedValue: debouncedParsedInputAmount } = useDebounce(
    parsedInputAmount,
    200
  );

  useEffect(() => {
    if (debouncedParsedInputAmount && inputToken && outputToken) {
      getSwapQuote({
        amount: debouncedParsedInputAmount,
        inputToken,
        outputToken,
      });
    }
  }, [debouncedParsedInputAmount, userAccount, outputToken, getSwapQuote]);

  //
  // Handlers
  //

  const onInputAmountChange = (amount: string) => {
    setAmountInputText(amount);
  };

  const onSwapPress = async () => {
    if (swapQuote) {
      await swap({
        inputs: swapQuote.inputs,
        output: swapQuote.output,
        swapQuote: swapQuote.quote,
      });

      navigation.navigate('Tabs', {
        screen: 'History',
      });
    }
  };

  //
  // Derived state
  //

  const hasEnoughBalance =
    inputTokenBalance !== undefined && parsedInputAmount !== null
      ? inputTokenBalance >= parsedInputAmount
      : undefined;

  const outputAmount = swapQuote?.quote?.details?.currencyOut?.amount;
  const outputAmountUsd = swapQuote?.quote?.details?.currencyOut?.amountUsd;

  const outputAmountFormatted =
    outputAmount && outputToken
      ? formatUnits(BigInt(outputAmount), outputToken.decimals)
      : '';

  const isAmountTooSmall =
    getSwapQuoteError?.message === TRPCErrorMessage.SWAP_AMOUNT_TOO_SMALL;

  return (
    <SearchOutputTokenSheetProvider>
      <SearchTokenSheetProvider>
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
            amount={amountInputText}
            setAmount={onInputAmountChange}
            balance={inputTokenBalance}
            isLoadingBalance={isLoadingTokenBalances}
          />
          <SwapOutputCard
            token={outputToken}
            setToken={setOutputToken}
            amount={outputAmountFormatted}
            setAmount={() => {}}
            isLoadingAmount={isGettingSwapQuote}
            usdAmount={outputAmountUsd ? Number(outputAmountUsd) : 0}
          />
          <StyledText style={{ color: colors.border }}>
            {swapQuote
              ? `Swap provider fee $${swapQuote.quote.fees.relayerService.amountUsd}`
              : ''}
          </StyledText>
          <StyledButton
            isLoading={isSwapping}
            title={
              isAmountTooSmall
                ? 'Amount too small'
                : hasEnoughBalance === false
                  ? 'Insufficient balance'
                  : 'Swap'
            }
            onPress={onSwapPress}
          />
        </View>
      </SearchTokenSheetProvider>
    </SearchOutputTokenSheetProvider>
  );
};

export default Swap;