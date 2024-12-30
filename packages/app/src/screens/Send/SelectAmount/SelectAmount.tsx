import SelectChainSheet from '@/components/SelectChainSheet/SelectChainSheet';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { getChainIcon } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import {
  BuildAggregateSendRequestBody,
  getChainFromId,
  TRPCErrorMessage,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Chain, parseUnits } from 'viem';
import Entypo from '@expo/vector-icons/Entypo';
import useTokenPriceUsd from '@/hooks/useTokenPriceUsd';
import BigNumber from 'bignumber.js';
import { trpc } from '@/lib/trpc';
import useChainTokenBalance from '@/hooks/useChainTokenBalance';
import AddressSelector from '@/components/AddressSelector/AddressSelector';

const ReviewButton = ({
  onPress,
  isLoading,
  isBalanceSufficient,
}: {
  onPress: () => void;
  isLoading: boolean;
  isBalanceSufficient: boolean;
}) => {
  return (
    <StyledButton
      disabled={!isBalanceSufficient}
      isLoading={isLoading}
      title={isBalanceSufficient ? 'Next' : 'Insufficient balance'}
      onPress={onPress}
    />
  );
};

const AmountInput = ({
  amount,
  setAmount,
  postfix,
}: {
  amount: string;
  setAmount: (amount: string) => void;
  postfix: string;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
      <TextInput
        keyboardType="numeric"
        value={amount}
        autoFocus
        onChangeText={setAmount}
        placeholder={'0.00'}
        style={{
          fontSize: fontSizes.twoXLarge,
          flexShrink: 1,
          width: '100%',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          height: 56,
          paddingHorizontal: 16,
        }}
        numberOfLines={1}
      />
      <StyledText
        style={{ fontSize: fontSizes.twoXLarge, color: colors.border }}
      >
        {postfix}
      </StyledText>
    </View>
  );
};

type Props = Pick<
  NativeStackScreenProps<RootStackParamsList, 'SelectAmount'>,
  'route'
>;

const containsNonNumericCharacters = (text: string) => {
  return /[^0-9.]/.test(text);
};

const SelectAmount = ({ route }: Props) => {
  const navigation = useTypedNavigation();
  const toAddress = route.params.toAddress;
  const fromAddresses = route.params.fromAddresses;
  const token = route.params.token;
  const chainId = route.params.chainId;

  ///
  /// Local state
  ///
  const [tokenAmountInputText, setTokenAmountInputText] = useState<string>('');
  const [usdAmountInputText, setUsdAmountInputText] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<Chain>(
    getChainFromId(chainId)
  );

  const [isSelectChainSheetOpen, setIsSelectChainSheetOpen] =
    useState<boolean>(false);

  const [isBalanceSufficient, setIsBalanceSufficient] = useState<boolean>(true);

  ///
  /// Queries
  ///

  const { data: tokenBalance } = useChainTokenBalance({
    chainId: selectedChain.id,
    token,
    address: fromAddresses[0],
  });

  const { data: tokenPriceUsd } = useTokenPriceUsd(token);

  ///
  /// Mutations
  ///

  const {
    data: _aggregatedSend,
    mutateAsync: buildAggregatedSend,
    isPending: isBuildingAggregatedSend,
    error: buildAggregateSendError,
  } = trpc.buildAggregateSend.useMutation({
    throwOnError: false,
  });

  ///
  /// Effects
  ///

  useEffect(() => {
    if (
      buildAggregateSendError?.message === TRPCErrorMessage.INSUFFICIENT_BALANCE
    ) {
      setIsBalanceSufficient(false);
    }
  }, [buildAggregateSendError]);

  useEffect(() => {
    if (containsNonNumericCharacters(tokenAmountInputText)) {
      return;
    }

    const parsedAmount = parseUnits(tokenAmountInputText, token.decimals);

    const buildAggregatedSendRequestBody: BuildAggregateSendRequestBody = {
      token,
      amount: parsedAmount.toString(),
      fromAddresses,
      toAddress,
      chainId: selectedChain.id,
    };

    buildAggregatedSend(buildAggregatedSendRequestBody);
  }, [tokenAmountInputText, selectedChain, fromAddresses, toAddress]);

  ///
  /// Handlers
  ///

  const handleTokenAmountInputTextChange = (amountText: string) => {
    setTokenAmountInputText(amountText);

    if (amountText === '') {
      setUsdAmountInputText('');
      return;
    }

    if (tokenPriceUsd !== undefined) {
      const usdAmount = new BigNumber(amountText)
        .multipliedBy(tokenPriceUsd)
        .toFixed(2);

      setUsdAmountInputText(usdAmount);
    }
  };

  const handleUsdAmountInputTextChange = (amountText: string) => {
    setUsdAmountInputText(amountText);

    if (amountText === '') {
      setTokenAmountInputText('');
      return;
    }

    if (tokenPriceUsd !== undefined) {
      const tokenAmount = new BigNumber(amountText).dividedBy(tokenPriceUsd);

      setTokenAmountInputText(tokenAmount.toString());
    }
  };

  const onReviewButtonPress = () => {
    navigation.navigate('ConfirmSend', {
      toAddress,
      fromAddresses,
      amount: tokenAmountInputText,
      token,
      chainId: selectedChain.id,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16, rowGap: 20 }}>
        <AddressSelector address={fromAddresses[0]} setAddress={() => {}} />
        <AmountInput
          amount={tokenAmountInputText}
          setAmount={handleTokenAmountInputTextChange}
          postfix={token.symbol}
        />
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            rowGap: 8,
          }}
        >
          <AmountInput
            amount={usdAmountInputText}
            setAmount={handleUsdAmountInputTextChange}
            postfix={'USD'}
          />
          <StyledText
            style={{ color: colors.border }}
          >{`Balance $${tokenBalance?.usdValue}`}</StyledText>
        </View>
        <View
          style={{
            flexDirection: 'column',
            rowGap: 14,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
            onPress={() => setIsSelectChainSheetOpen(true)}
          >
            <Image
              style={{ width: 24, height: 24 }}
              source={getChainIcon(selectedChain.id)}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 0,
              }}
            >
              <StyledText>{`${selectedChain.name}`}</StyledText>
              <Entypo
                name="chevron-small-down"
                size={24}
                color={colors.border}
              />
            </View>
          </Pressable>
        </View>
        <ReviewButton
          onPress={onReviewButtonPress}
          isLoading={isBuildingAggregatedSend}
          isBalanceSufficient={isBalanceSufficient}
        />
      </View>
      <SelectChainSheet
        open={isSelectChainSheetOpen}
        onSelect={chain => {
          setSelectedChain(chain);
          setIsSelectChainSheetOpen(false);
        }}
      />
    </View>
  );
};

export default SelectAmount;
