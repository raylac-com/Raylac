import { useEffect, useState } from 'react';
import { View } from 'react-native';
import SwapInputCard from '../SwapInputCard/SwapInputCard';
import SwapOutputCard from '../SwapOutputCard/SwapOutputCard';
import { trpc } from '@/lib/trpc';
import { formatUnits, hexToBigInt, parseUnits } from 'viem';
import useUserAddress from '@/hooks/useUserAddress';
import {
  GetSwapQuoteReturnType,
  supportedChains,
  SupportedTokensReturnType,
  TokenBalancesReturnType,
  TRPCErrorMessage,
} from '@raylac/shared';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import StyledButton from '@/components/StyledButton/StyledButton';
import useGetSwapQuote from '@/hooks/useGetSwapQuote';
import useSwap from '@/hooks/useSwap';
import useDebounce from '@/hooks/useDebounce';

type Token = SupportedTokensReturnType[number];

const SwapSheet = () => {
  //
  // Local State
  //

  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [amountInputText, setAmountInputText] = useState<string>('');

  const { data: userAddress } = useUserAddress();

  //
  // Fetch data
  //

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      address: userAddress!,
    },
    {
      enabled: !!userAddress,
    }
  );

  // Get the selected balacne of the selected input
  const inputTokenBalance = inputToken
    ? tokenBalances?.find(token =>
        token.breakdown?.some(breakdown =>
          inputToken.addresses.some(
            address =>
              breakdown.tokenAddress === address.address &&
              address.chainId === breakdown.chainId
          )
        )
      )
    : null;

  const { data: supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

  // Mutations

  const {
    mutate: getSwapQuote,
    data: swapQuote,
    error: getSwapQuoteError,
  } = useGetSwapQuote();

  const { mutate: swap, isPending: isSwapping } = useSwap();

  //
  // Effects
  //

  useEffect(() => {
    if (supportedTokens) {
      setInputToken(supportedTokens[0] as Token);
      setOutputToken(supportedTokens[1] as Token);
    }
  }, [supportedTokens]);

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
      inputTokenBalance
    ) {
      getSwapQuote({
        amount: debouncedParsedInputAmount,
        inputToken,
        outputToken,
        inputTokenBalance: inputTokenBalance as TokenBalancesReturnType[number],
      });
    }
  }, [
    debouncedParsedInputAmount,
    userAddress,
    outputToken,
    getSwapQuote,
    inputTokenBalance,
  ]);

  //
  // Handlers
  //

  const onInputAmountChange = (amount: string) => {
    setAmountInputText(amount);
  };

  const onSwapPress = async () => {
    if (swapQuote) {
      await swap({ swapQuote: swapQuote as GetSwapQuoteReturnType });

      SheetManager.hide('swap-sheet');
    }
  };

  //
  // Derived state
  //

  const hasEnoughBalance =
    inputTokenBalance && parsedInputAmount !== null
      ? hexToBigInt(inputTokenBalance.balance) >= parsedInputAmount
      : null;

  const outputAmount = swapQuote?.details?.currencyOut?.amount;

  const outputAmountFormatted =
    outputAmount && outputToken
      ? formatUnits(BigInt(outputAmount), outputToken.decimals)
      : '';

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
          amount={amountInputText}
          setAmount={onInputAmountChange}
          balance={
            inputTokenBalance ? hexToBigInt(inputTokenBalance.balance) : null
          }
        />
        <SwapOutputCard
          token={outputToken}
          setToken={setOutputToken}
          amount={outputAmountFormatted}
          setAmount={() => {}}
          isLoadingAmount={false}
        />
        {/**
         * Show quote
         */}
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
    </ActionSheet>
  );
};

export default SwapSheet;