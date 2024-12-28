import { useEffect, useState } from 'react';
import SwapInputCard from './components/SwapInputCard/SwapInputCard';
import SwapOutputCard from './components/SwapOutputCard/SwapOutputCard';
import { formatUnits, parseUnits } from 'viem';
import useUserAccount from '@/hooks/useUserAccount';
import { SupportedTokensReturnType, TRPCErrorMessage } from '@raylac/shared';
import StyledButton from '@/components/StyledButton/StyledButton';
import useGetSwapQuote from '@/hooks/useGetSwapQuote';
import useDebounce from '@/hooks/useDebounce';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import useTokenBalance from '@/hooks/useTokenBalance';
import { View } from 'react-native';
import { SearchTokenSheetProvider } from '@/contexts/SearchInputTokenSheetContext';
import { SearchOutputTokenSheetProvider } from '@/contexts/SearchOutputTokenSheetContext';
import SwapPath from './components/SwapPath/SwapPath';
import useSwap from '@/hooks/useSwap';

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

  /*
  const { data: tokenBalances, isLoading: isLoadingTokenBalances } =
    trpc.getTokenBalances.useQuery(
      {
        address: userAccount?.address ?? zeroAddress,
      },
      {
        enabled: !!userAccount,
      }
    );
  */

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
    if (!inputToken) {
      throw new Error('Input token is null');
    }

    if (!outputToken) {
      throw new Error('Output token is null');
    }

    if (!swapQuote) {
      throw new Error('Swap quote is null');
    }

    await swap({
      swapQuote,
      inputToken,
      outputToken,
    });

    setInputToken(null);
    setOutputToken(null);
    setAmountInputText('');

    navigation.navigate('Tabs', {
      screen: 'History',
    });
  };

  //
  // Derived state
  //

  const hasEnoughBalance =
    inputTokenBalance !== undefined && parsedInputAmount !== null
      ? inputTokenBalance >= parsedInputAmount
      : undefined;

  const outputAmount = swapQuote?.amountOut;
  const outputAmountUsd = swapQuote?.amountOutUsd;

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
            flex: 1,
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
        >
          <View style={{ flex: 1, rowGap: 16 }}>
            <SwapInputCard
              token={inputToken}
              setToken={setInputToken}
              amount={amountInputText}
              setAmount={onInputAmountChange}
              balance={inputTokenBalance}
              isLoadingBalance={false}
              // isLoadingBalance={isLoadingTokenBalances}
            />
            {swapQuote && inputToken && outputToken && (
              <SwapPath
                inputs={swapQuote.inputs.map(input => ({
                  ...input,
                  token: inputToken,
                }))}
                output={{
                  chainId: swapQuote.output.chainId,
                  token: outputToken,
                }}
              />
            )}
            <SwapOutputCard
              token={outputToken}
              setToken={setOutputToken}
              amount={outputAmountFormatted}
              setAmount={() => {}}
              isLoadingAmount={isGettingSwapQuote}
              usdAmount={outputAmountUsd ? Number(outputAmountUsd) : 0}
            />
          </View>
          <View style={{ rowGap: 16 }}>
            <StyledText style={{ color: colors.border }}>
              {swapQuote ? `Total fee $${swapQuote.relayerServiceFeeUsd}` : ''}
            </StyledText>
            <StyledButton
              disabled={
                isAmountTooSmall ||
                hasEnoughBalance === false ||
                isSwapping ||
                !swapQuote
              }
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
        </View>
      </SearchTokenSheetProvider>
    </SearchOutputTokenSheetProvider>
  );
};

export default Swap;
