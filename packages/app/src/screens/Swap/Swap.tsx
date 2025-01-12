import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import SwapInputCard from './components/SwapInputCard/SwapInputCard';
import SwapOutputCard from './components/SwapOutputCard/SwapOutputCard';
import { Hex, parseUnits, zeroAddress } from 'viem';
import {
  containsNonNumericCharacters,
  ETH,
  GetSingleInputSwapQuoteRequestBody,
  GetSingleInputSwapQuoteReturnType,
  supportedChains,
  Token,
  TokenAmount,
  TRPCErrorMessage,
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
import { mainnet } from 'viem/chains';
import useAddressChainTokenBalance from '@/hooks/useAddressChainTokenBalance';
import useAddressTokenBalance from '@/hooks/useAddressTokenBalance';
import SlippageDetailsSheet from '@/components/SlippageDetailsSheet/SlippageDetailsSheet';

const SwapButton = ({
  swapQuoteLoaded,
  isAmountTooSmall,
  isOriginChainGasSufficient,
  isBalanceSufficient,
  isLoading,
  onPress,
}: {
  swapQuoteLoaded: boolean;
  isAmountTooSmall: boolean;
  isOriginChainGasSufficient: boolean | null;
  isBalanceSufficient: boolean | null;
  isLoading: boolean;
  onPress: () => void;
}) => {
  let label;

  if (isAmountTooSmall) {
    label = 'Amount too small';
  } else if (isBalanceSufficient === false) {
    label = 'Insufficient balance';
  } else if (isOriginChainGasSufficient === false) {
    label = 'Insufficient origin chain gas';
  } else {
    label = 'Swap';
  }

  const disabled =
    isOriginChainGasSufficient === false ||
    isBalanceSufficient === false ||
    isAmountTooSmall ||
    isLoading ||
    !swapQuoteLoaded;

  return (
    <StyledButton
      title={label}
      onPress={onPress}
      isLoading={isLoading}
      disabled={disabled}
    />
  );
};

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

const SlippageTolerance = ({
  outputToken,
  minimumAmountOut,
  slippagePercent,
}: {
  outputToken: Token | null;
  minimumAmountOut: TokenAmount | undefined;
  slippagePercent: number | undefined;
}) => {
  const [isSlippageDetailsSheetOpen, setIsSlippageDetailsSheetOpen] =
    useState(false);

  if (!outputToken || !minimumAmountOut || !slippagePercent) {
    return null;
  }

  return (
    <FeedbackPressable
      onPress={() => setIsSlippageDetailsSheetOpen(true)}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <StyledText
        style={{ color: colors.border }}
      >{`Max slippage `}</StyledText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
          {`${slippagePercent}%`}
        </StyledText>
        <Feather name="chevron-right" size={24} color={colors.border} />
      </View>
      <SlippageDetailsSheet
        isOpen={isSlippageDetailsSheetOpen}
        onClose={() => setIsSlippageDetailsSheetOpen(false)}
        minimumAmountOut={minimumAmountOut}
        slippagePercent={slippagePercent}
        token={outputToken}
      />
    </FeedbackPressable>
  );
};

type Props = NativeStackScreenProps<RootTabsParamsList, 'Swap'>;

const Swap = ({ route }: Props) => {
  const navigation = useTypedNavigation();
  const { data: writerAddresses } = useWriterAddresses();
  const { fromToken, bridge } = route.params ?? {
    fromToken: null,
    bridge: false,
  };

  //
  // Local State
  //

  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [amountInputText, setAmountInputText] = useState<string>('');
  const [inputChainId, setInputChainId] = useState<number | null>(null);
  const [outputChainId, setOutputChainId] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Hex | null>(null);
  const [isBalanceSufficient, setIsBalanceSufficient] = useState<
    boolean | null
  >(null);
  const [isOriginChainGasSufficient, setIsOriginChainGasSufficient] = useState<
    boolean | null
  >(null);

  //
  // Fetch data
  //

  const inputTokenBalances = useAddressTokenBalance({
    address: selectedAddress,
    token: inputToken,
  });

  const { data: inputTokenChainBalance } = useChainTokenBalance({
    chainId: inputChainId,
    token: inputToken,
    address: selectedAddress ?? zeroAddress,
  });

  const ethBalance = useAddressChainTokenBalance({
    address: selectedAddress ?? zeroAddress,
    chainId: inputChainId ?? mainnet.id,
    token: ETH,
  });

  // Prefetch supported tokens
  const { data: _supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

  // Mutations

  const {
    mutate: getSwapQuote,
    data: swapQuote,
    isPending: isGettingSwapQuote,
    error: getSwapQuoteError,
    reset: resetGetSwapQuote,
  } = trpc.getSingleInputSwapQuote.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: submitSingleInputSwap, isPending: isSwapping } =
    useSingleInputSwap();

  //
  // Effects
  //

  // Hook to set the initial selected address
  useEffect(() => {
    if (writerAddresses) {
      if (writerAddresses.length > 0) {
        setSelectedAddress(writerAddresses[0].address);
      }
    }
  }, [writerAddresses]);

  // Hook to set the initial input token
  useEffect(() => {
    // If the fromToken is provided and the inputToekn is null, set the inputToken
    if (fromToken) {
      setInputToken(fromToken);

      // If the bridge flag is true, set the outputToken to ETH
      if (bridge) {
        setOutputToken(fromToken);
        setOutputChainId(fromToken.addresses[0].chainId);
      }
    }
  }, [fromToken, bridge]);

  // Hook to set the initial input chain id
  useEffect(() => {
    if (
      inputTokenBalances &&
      inputTokenBalances.chainBalances.length > 0 &&
      inputChainId === null
    ) {
      // Set `inputChainId` to the chain with the most balance (the `chainBalances` array is sorted by balance)
      setInputChainId(inputTokenBalances.chainBalances[0].chainId);

      // If the bridge flag is true, set the outputChainId to the inputChainId
      if (bridge) {
        setOutputToken(inputToken);
        if (inputTokenBalances.chainBalances.length > 1) {
          setOutputChainId(inputTokenBalances.chainBalances[1].chainId);
        }
      }
    }
  }, [inputTokenBalances, bridge]);

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

  // Hook to check if the origin chain  gas is sufficient
  useEffect(() => {
    if (swapQuote && ethBalance && inputToken) {
      if (inputToken.id === zeroAddress) {
        // The swap input is ETH

        // We check if the input amount plus the gas fee is less than the available ETH
        const inputAmountPlusGas =
          BigInt(swapQuote.amountIn.amount) +
          BigInt(swapQuote.originChainGas.amount);

        const _isOriginChainGasSufficient =
          BigInt(ethBalance.amount) >= inputAmountPlusGas;

        setIsOriginChainGasSufficient(_isOriginChainGasSufficient);
      } else {
        // The swap input is an ERC20 token (not ETH)

        // We check if the gas fee is less than the available ETH
        const _isOriginChainGasSufficient =
          BigInt(ethBalance.amount) >= BigInt(swapQuote.originChainGas.amount);

        setIsOriginChainGasSufficient(_isOriginChainGasSufficient);
      }
    }
  }, [swapQuote, ethBalance, inputToken]);

  // Hook to check if the balance is sufficient
  useEffect(() => {
    if (inputTokenChainBalance && swapQuote) {
      const _isBalanceSufficient =
        BigInt(inputTokenChainBalance.amount) >=
        BigInt(swapQuote.amountIn.amount);

      setIsBalanceSufficient(_isBalanceSufficient);
    }
  }, [swapQuote, inputTokenChainBalance]);

  const parsedInputAmount =
    !containsNonNumericCharacters(amountInputText) && inputToken
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
      resetGetSwapQuote();
      setIsOriginChainGasSufficient(null);
      setIsBalanceSufficient(null);
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
      // Set the output token
      setOutputToken(token);

      // Set the output chain id to the input chain id if the output token is supported on the input chain
      if (
        inputChainId &&
        token.addresses.some(a => a.chainId === inputChainId)
      ) {
        setOutputChainId(inputChainId);
      } else {
        setOutputChainId(token.addresses[0].chainId);
      }
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

    if (!inputChainId) {
      throw new Error('Input chain id is null');
    }

    if (!outputChainId) {
      throw new Error('Output chain id is null');
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

    Toast.show({
      type: 'success',
      text1: 'Swap transaction sent',
      position: 'bottom',
    });

    const isCrossChainSwap = inputChainId !== outputChainId;

    const pendingSwapData: NonNullable<
      RootTabsParamsList['History']
    >['pendingSwap'] =
      isCrossChainSwap === false
        ? {
            address: selectedAddress,
            tokenIn: inputToken,
            tokenOut: outputToken,
            inputAmount: swapQuote.amountIn,
            outputAmount: swapQuote.amountOut,
            chainId: inputChainId,
            requestId: swapQuote.relayRequestId,
          }
        : undefined;

    const pendingCrossChainSwapData: NonNullable<
      RootTabsParamsList['History']
    >['pendingCrossChainSwap'] =
      isCrossChainSwap === true
        ? {
            address: selectedAddress,
            tokenIn: inputToken,
            tokenOut: outputToken,
            fromChainId: inputChainId,
            toChainId: outputChainId,
            requestId: swapQuote.relayRequestId,
            amountIn: swapQuote.amountIn,
            amountOut: swapQuote.amountOut,
          }
        : undefined;

    const pendingBridgeData: NonNullable<
      RootTabsParamsList['History']
    >['pendingBridge'] =
      isCrossChainSwap === true
        ? {
            address: selectedAddress,
            token: inputToken,
            fromChainId: inputChainId,
            toChainId: outputChainId,
            requestId: swapQuote.relayRequestId,
            amountIn: swapQuote.amountIn,
            amountOut: swapQuote.amountOut,
          }
        : undefined;

    setInputToken(null);
    setOutputToken(null);
    setAmountInputText('');
    setInputChainId(null);
    setOutputChainId(null);
    setSelectedAddress(null);
    resetGetSwapQuote();

    if (pendingSwapData) {
      // Navigate to the history screen with the pending swap data
      navigation.navigate('Tabs', {
        screen: 'History',
        params: {
          pendingSwap: pendingSwapData,
        },
      });
    } else if (pendingCrossChainSwapData) {
      // Navigate to the history screen with the pending cross chain swap data
      navigation.navigate('Tabs', {
        screen: 'History',
        params: {
          pendingCrossChainSwap: pendingCrossChainSwapData,
        },
      });
    } else if (pendingBridgeData) {
      // Navigate to the history screen with the pending bridge data
      navigation.navigate('Tabs', {
        screen: 'History',
        params: {
          pendingBridge: pendingBridgeData,
        },
      });
    } else {
      throw new Error('No pending swap or cross chain swap data');
    }
  };

  //
  // Derived state
  //

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
      <View
        style={{
          flex: 1,
          rowGap: 16,
          flexDirection: 'column',
        }}
      >
        <SwapInputCard
          address={selectedAddress}
          token={inputToken}
          setToken={onInputTokenChange}
          amount={amountInputText}
          setAmount={onInputAmountChange}
          balance={
            inputTokenChainBalance?.amount
              ? BigInt(inputTokenChainBalance.amount)
              : undefined
          }
          isLoadingBalance={false}
          chainId={inputChainId}
          setChainId={setInputChainId}
          // isLoadingBalance={isLoadingTokenBalances}
        />
        <FeedbackPressable
          style={{
            alignSelf: 'center',
            marginTop: -24,
            marginBottom: -24,
            backgroundColor: colors.background,
          }}
          onPress={() => {
            const _inputToken = inputToken;
            const _outputToken = outputToken;
            const _inputChainId = inputChainId;
            const _outputChainId = outputChainId;

            setInputToken(_outputToken);
            setOutputToken(_inputToken);
            setInputChainId(_outputChainId);
            setOutputChainId(_inputChainId);
          }}
        >
          <Feather
            name="repeat"
            size={24}
            color={colors.border}
            style={{ transform: [{ rotate: '90deg' }] }}
          />
        </FeedbackPressable>
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
        <SlippageTolerance
          outputToken={outputToken}
          minimumAmountOut={swapQuote?.minimumAmountOut}
          slippagePercent={swapQuote?.slippagePercent}
        />
        <TotalFee swapQuote={swapQuote} />
        <AddressSelector
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
        <SwapButton
          swapQuoteLoaded={swapQuote !== undefined}
          isAmountTooSmall={isAmountTooSmall}
          isOriginChainGasSufficient={isOriginChainGasSufficient}
          isBalanceSufficient={isBalanceSufficient}
          isLoading={isSwapping || isGettingSwapQuote}
          onPress={onSwapPress}
        />
      </View>
    </View>
  );
};

export default Swap;
