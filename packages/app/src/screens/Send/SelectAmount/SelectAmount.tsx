import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import {
  Balance,
  BuildAggregateSendRequestBody,
  formatBalance,
  GetEstimatedTransferGasRequestBody,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { formatUnits, parseUnits } from 'viem';
import BigNumber from 'bignumber.js';
import { trpc } from '@/lib/trpc';
import useChainTokenBalance from '@/hooks/useChainTokenBalance';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import useTokenPriceUsd from '@/hooks/useTokenPriceUsd';
import Skeleton from '@/components/Skeleton/Skeleton';

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

const GasInfo = ({
  gas,
  isFetchingGasInfo,
}: {
  gas: Balance | undefined;
  isFetchingGasInfo: boolean;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
      <FontAwesome5 name="gas-pump" size={18} color={colors.subbedText} />
      <StyledText style={{ color: colors.subbedText }}>{`Gas`}</StyledText>
      {isFetchingGasInfo ? (
        <Skeleton style={{ width: 100, height: 20 }} />
      ) : (
        <StyledText style={{ color: colors.subbedText }}>
          {`$${gas?.usdValueFormatted || '0'} (${gas?.formatted || '0'} ETH)`}
        </StyledText>
      )}
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

  const [isBalanceSufficient, setIsBalanceSufficient] = useState<boolean>(true);

  ///
  /// Queries
  ///

  const { data: tokenBalance } = useChainTokenBalance({
    chainId,
    token,
    address: fromAddresses[0],
  });

  const { data: tokenPriceUsd } = useTokenPriceUsd(token);

  ///
  /// Mutations
  ///

  const {
    data: estimatedTransferGas,
    mutate: getEstimatedTransferGas,
    isPending: isFetchingGasInfo,
  } = trpc.getEstimatedTransferGas.useMutation();

  const {
    data: aggregatedSend,
    mutateAsync: buildAggregatedSend,
    isPending: isBuildingAggregatedSend,
  } = trpc.buildAggregateSend.useMutation({
    throwOnError: false,
  });

  ///
  /// Effects
  ///

  useEffect(() => {
    if (tokenAmountInputText !== '' && aggregatedSend && tokenBalance) {
      const parsedAmount = parseUnits(tokenAmountInputText, token.decimals);

      if (parsedAmount === BigInt(0)) {
        return;
      }

      const isBalanceSufficient =
        tokenBalance.balance && parsedAmount <= BigInt(tokenBalance.balance);

      if (isBalanceSufficient) {
        const requestBody: GetEstimatedTransferGasRequestBody = {
          chainId,
          token,
          amount: parsedAmount.toString(),
          to: toAddress,
          from: fromAddresses[0],
          maxFeePerGas: aggregatedSend.inputs[0].tx.maxFeePerGas,
        };

        getEstimatedTransferGas(requestBody);
      }
    }
  }, [tokenAmountInputText, aggregatedSend, tokenBalance]);

  useEffect(() => {
    if (tokenBalance) {
      const _isBalanceSufficient =
        parseUnits(tokenAmountInputText, token.decimals) <=
        BigInt(tokenBalance.balance);

      setIsBalanceSufficient(_isBalanceSufficient);
    }
  }, [tokenAmountInputText, tokenBalance]);

  useEffect(() => {
    if (containsNonNumericCharacters(tokenAmountInputText)) {
      return;
    }

    const parsedAmount = parseUnits(tokenAmountInputText, token.decimals);

    if (parsedAmount === BigInt(0)) {
      return;
    }

    const buildAggregatedSendRequestBody: BuildAggregateSendRequestBody = {
      token,
      amount: parsedAmount.toString(),
      fromAddresses,
      toAddress,
      chainId,
    };

    buildAggregatedSend(buildAggregatedSendRequestBody);
  }, [tokenAmountInputText, fromAddresses, toAddress, chainId]);

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
      // Update the USD amount
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
      // Update the USD amount
      const tokenAmount = new BigNumber(amountText).dividedBy(tokenPriceUsd);

      setTokenAmountInputText(tokenAmount.toString());
    }
  };

  const onReviewButtonPress = () => {
    const formattedAmount = formatBalance({
      balance: parseUnits(tokenAmountInputText, token.decimals),
      token,
      tokenPriceUsd: Number(tokenPriceUsd),
    });

    navigation.navigate('ConfirmSend', {
      toAddress,
      fromAddresses,
      amount: formattedAmount,
      token,
      chainId,
    });
  };

  const onMaxBalancePress = () => {
    if (tokenBalance) {
      const amountText = formatUnits(
        BigInt(tokenBalance.balance),
        token.decimals
      );
      setTokenAmountInputText(amountText);

      if (tokenPriceUsd !== undefined) {
        // Update the USD amount
        const usdAmount = new BigNumber(amountText)
          .multipliedBy(tokenPriceUsd)
          .toFixed(2);

        setUsdAmountInputText(usdAmount);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16, rowGap: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            paddingVertical: 24,
            justifyContent: 'center',
          }}
        >
          <TokenLogoWithChain
            logoURI={token.logoURI}
            chainId={chainId}
            size={64}
          />
        </View>
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
          <Pressable
            onPress={onMaxBalancePress}
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
          >
            <StyledText
              style={{ color: colors.border, fontWeight: 'bold' }}
            >{`MAX`}</StyledText>
            <StyledText style={{ color: colors.border }}>
              {`Balance $${tokenBalance?.usdValueFormatted}`}
            </StyledText>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'column', rowGap: 8 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
          >
            <StyledText style={{ color: colors.subbedText }}>
              {`Send from `}
            </StyledText>
            <StyledText
              style={{ color: colors.subbedText, fontWeight: 'bold' }}
            >
              {shortenAddress(fromAddresses[0])}
            </StyledText>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: 4,
            }}
          >
            <GasInfo
              gas={estimatedTransferGas}
              isFetchingGasInfo={isFetchingGasInfo}
            />
          </View>
        </View>
        <ReviewButton
          onPress={onReviewButtonPress}
          isLoading={isBuildingAggregatedSend}
          isBalanceSufficient={isBalanceSufficient}
        />
      </View>
    </View>
  );
};

export default SelectAmount;
