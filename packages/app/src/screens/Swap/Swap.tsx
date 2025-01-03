import { useEffect, useState } from 'react';
import SwapInputCard from './components/SwapInputCard/SwapInputCard';
import SwapOutputCard from './components/SwapOutputCard/SwapOutputCard';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import useUserAccount from '@/hooks/useUserAccount';
import { SupportedTokensReturnType, TRPCErrorMessage } from '@raylac/shared';
import StyledButton from '@/components/StyledButton/StyledButton';
import useGetSwapQuote from '@/hooks/useGetSwapQuote';
import useDebounce from '@/hooks/useDebounce';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { View } from 'react-native';
import { SearchTokenSheetProvider } from '@/contexts/SearchInputTokenSheetContext';
import { SearchOutputTokenSheetProvider } from '@/contexts/SearchOutputTokenSheetContext';
import useSingleInputSwap from '@/hooks/useSingleInputSwap';
import useChainTokenBalance from '@/hooks/useChainTokenBalance';

type Token = SupportedTokensReturnType[number];

const Swap = () => {
  const navigation = useTypedNavigation();

  //
  // Local State
  //

  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [amountInputText, setAmountInputText] = useState<string>('');
  const [inputChainId, setInputChainId] = useState<number | null>(null);
  const [outputChainId, setOutputChainId] = useState<number | null>(null);

  const { data: userAccount } = useUserAccount();

  //
  // Fetch data
  //

  const { data: inputTokenBalance } = useChainTokenBalance({
    chainId: inputChainId,
    token: inputToken,
    address: userAccount?.address ?? zeroAddress,
  });

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

  const { mutateAsync: submitSingleInputSwap, isPending: isSwapping } =
    useSingleInputSwap();

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
    if (
      debouncedParsedInputAmount &&
      inputToken &&
      outputToken &&
      inputChainId &&
      outputChainId
    ) {
      getSwapQuote({
        amount: debouncedParsedInputAmount,
        inputToken,
        outputToken,
        inputChainId,
        outputChainId,
      });
    }
  }, [
    debouncedParsedInputAmount,
    userAccount,
    outputToken,
    getSwapQuote,
    inputChainId,
    outputChainId,
  ]);

  //
  // Handlers
  //

  const onInputAmountChange = (amount: string) => {
    setAmountInputText(amount);
  };

  const onInputTokenChange = (token: Token | null) => {
    if (token) {
      setInputToken(token);
      setInputChainId(token.addresses[0].chainId);
    } else {
      setInputToken(null);
      setInputChainId(null);
    }
  };

  const onOutputTokenChange = (token: Token | null) => {
    if (token) {
      setOutputToken(token);
      setOutputChainId(token.addresses[0].chainId);
    } else {
      setOutputToken(null);
      setOutputChainId(null);
    }
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

    await submitSingleInputSwap({
      swapQuote,
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
    inputTokenBalance !== null &&
    inputTokenBalance !== undefined &&
    parsedInputAmount !== null
      ? BigInt(inputTokenBalance.amount) >= parsedInputAmount
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
              setToken={onInputTokenChange}
              amount={amountInputText}
              setAmount={onInputAmountChange}
              balance={
                inputTokenBalance?.amount
                  ? BigInt(inputTokenBalance.amount)
                  : undefined
              }
              isLoadingBalance={false}
              chainId={inputChainId}
              setChainId={setInputChainId}
              // isLoadingBalance={isLoadingTokenBalances}
            />
            <SwapOutputCard
              token={outputToken}
              setToken={onOutputTokenChange}
              amount={outputAmountFormatted}
              setAmount={() => {}}
              isLoadingAmount={isGettingSwapQuote}
              usdAmount={outputAmountUsd ? Number(outputAmountUsd) : 0}
              chainId={outputChainId}
              setChainId={setOutputChainId}
            />
          </View>
          <View style={{ rowGap: 16 }}>
            <StyledText style={{ color: colors.border }}>
              {swapQuote ? `Bridge fee $${swapQuote.relayerServiceFeeUsd}` : ''}
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
