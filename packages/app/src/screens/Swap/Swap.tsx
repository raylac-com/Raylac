import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import SwapInputCard from './components/SwapInputCard/SwapInputCard';
import SwapOutputCard from './components/SwapOutputCard/SwapOutputCard';
import { Hex, parseUnits, zeroAddress } from 'viem';
import {
  ETH,
  GetSingleInputSwapQuoteRequestBody,
  GetSingleInputSwapQuoteReturnType,
  Token,
  TRPCErrorMessage,
  USDC,
} from '@raylac/shared';
import StyledButton from '@/components/StyledButton/StyledButton';
import useDebounce from '@/hooks/useDebounce';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { View } from 'react-native';
import useSingleInputSwap from '@/hooks/useSingleInputSwap';
import useChainTokenBalance from '@/hooks/useChainTokenBalance';
import AddressSelector from './components/AddressSelector/AddressSelector';
import useWriterAddresses from '@/hooks/useWriterAddresses';
import { RootTabsParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { trpc } from '@/lib/trpc';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import SwapFeeDetailsSheet from '@/components/SwapFeeDetailsSheet/SwapFeeDetailsSheet';
import { base } from 'viem/chains';

const TotalFee = ({
  swapQuote,
}: {
  swapQuote: GetSingleInputSwapQuoteReturnType | undefined;
}) => {
  const [isFeeDetailsSheetOpen, setIsFeeDetailsSheetOpen] = useState(false);

  if (!swapQuote) {
    return null;
  }

  return (
    <FeedbackPressable
      onPress={() => setIsFeeDetailsSheetOpen(true)}
      style={{
        rowGap: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <StyledText style={{ color: colors.border }}>{`Total fee `}</StyledText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
          {`${swapQuote.totalFeeUsd} USD`}
        </StyledText>
        <Feather name="chevron-right" size={24} color={colors.border} />
      </View>
      <SwapFeeDetailsSheet
        isOpen={isFeeDetailsSheetOpen}
        onClose={() => setIsFeeDetailsSheetOpen(false)}
        swapQuote={swapQuote}
      />
    </FeedbackPressable>
  );
};

type Props = NativeStackScreenProps<RootTabsParamsList, 'Swap'>;

const Swap = ({ route }: Props) => {
  const navigation = useTypedNavigation();
  const { data: writerAddresses } = useWriterAddresses();
  const { fromToken } = route.params ?? { fromToken: null };

  //
  // Local State
  //

  const [inputToken, setInputToken] = useState<Token | null>(ETH);
  const [outputToken, setOutputToken] = useState<Token | null>(USDC);
  const [amountInputText, setAmountInputText] = useState<string>('0.01');
  const [inputChainId, setInputChainId] = useState<number | null>(base.id);
  const [outputChainId, setOutputChainId] = useState<number | null>(base.id);
  const [selectedAddress, setSelectedAddress] = useState<Hex | null>(null);

  //
  // Fetch data
  //

  const { data: inputTokenBalance } = useChainTokenBalance({
    chainId: inputChainId,
    token: inputToken,
    address: selectedAddress ?? zeroAddress,
  });

  // Mutations

  const {
    mutate: getSwapQuote,
    data: swapQuote,
    isPending: isGettingSwapQuote,
    error: getSwapQuoteError,
  } = trpc.getSingleInputSwapQuote.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: submitSingleInputSwap, isPending: isSwapping } =
    useSingleInputSwap();

  //
  // Effects
  //

  useEffect(() => {
    if (fromToken) {
      setInputToken(fromToken);
    }
  }, [fromToken]);

  useEffect(() => {
    if (writerAddresses) {
      if (writerAddresses.length > 0) {
        setSelectedAddress(writerAddresses[0].address);
      }
    }
  }, [writerAddresses]);

  useEffect(() => {
    if (getSwapQuoteError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getSwapQuoteError.message,
        position: 'bottom',
      });
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
      outputChainId &&
      selectedAddress
    ) {
      const requestBody: GetSingleInputSwapQuoteRequestBody = {
        sender: selectedAddress,
        amount: debouncedParsedInputAmount.toString(),
        inputToken,
        outputToken,
        inputChainId,
        outputChainId,
      };

      getSwapQuote(requestBody);
    }
  }, [
    selectedAddress,
    debouncedParsedInputAmount,
    inputToken,
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

    if (!selectedAddress) {
      throw new Error('Selected address is null');
    }

    await submitSingleInputSwap({
      address: selectedAddress,
      swapQuote,
    });

    setInputToken(null);
    setOutputToken(null);
    setAmountInputText('');

    const pendingSwapData = {
      address: selectedAddress,
      tokenIn: inputToken,
      tokenOut: outputToken,
      inputAmount: swapQuote.amountIn,
      outputAmount: swapQuote.amountOut,
      fromChainId: inputChainId,
      toChainId: outputChainId,
      requestId: swapQuote.relayRequestId,
    };

    navigation.navigate('Tabs', {
      screen: 'History',
      params: {
        pendingSwap: pendingSwapData,
      },
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

  const isAmountTooSmall =
    getSwapQuoteError?.message === TRPCErrorMessage.SWAP_AMOUNT_TOO_SMALL;

  return (
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
          address={selectedAddress}
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
          amount={swapQuote?.amountOut}
          setAmount={() => {}}
          isLoadingAmount={isGettingSwapQuote}
          chainId={outputChainId}
          setChainId={setOutputChainId}
        />
      </View>
      <View style={{ rowGap: 16 }}>
        <TotalFee swapQuote={swapQuote} />
        <AddressSelector
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
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
  );
};

export default Swap;
