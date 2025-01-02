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
  formatAmount,
  GetEstimatedTransferGasRequestBody,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { formatUnits, Hex, parseUnits } from 'viem';
import BigNumber from 'bignumber.js';
import { trpc } from '@/lib/trpc';
import useChainTokenBalance from '@/hooks/useChainTokenBalance';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import useTokenPriceUsd from '@/hooks/useTokenPriceUsd';
import Skeleton from '@/components/Skeleton/Skeleton';
import SendToCard from '@/components/SendToCard/SendToCard';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import useSend from '@/hooks/useSend';

const ConfirmButton = ({
  onPress,
  isLoading,
}: {
  onPress: () => void;
  isLoading: boolean;
}) => {
  return (
    <StyledButton title="Confirm" onLongPress={onPress} isLoading={isLoading} />
  );
};

const ReviewButton = ({
  onPress,
  isLoading,
  isBalanceSufficient,
  isReadyForReview,
}: {
  onPress: () => void;
  isLoading: boolean;
  isBalanceSufficient: boolean;
  isReadyForReview: boolean;
}) => {
  return (
    <StyledButton
      disabled={!isBalanceSufficient || !isReadyForReview}
      isLoading={isLoading}
      title={isBalanceSufficient ? 'Review' : 'Insufficient balance'}
      onPress={onPress}
    />
  );
};

const SendFromDetail = ({ address }: { address: Hex }) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText style={{ color: colors.subbedText }}>
        {`Send from`}
      </StyledText>
      <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
        {shortenAddress(address)}
      </StyledText>
    </View>
  );
};

const BalanceDetail = ({
  balance,
  onMaxPress,
}: {
  balance: Balance | undefined;
  onMaxPress: () => void;
}) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText style={{ color: colors.subbedText }}>{`Balance`}</StyledText>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        {balance ? (
          <StyledText style={{ color: colors.subbedText }}>
            {`$${balance.usdValueFormatted}`}
          </StyledText>
        ) : (
          <Skeleton style={{ width: 100, height: 20 }} />
        )}
        <Pressable onPress={onMaxPress}>
          <StyledText
            style={{ color: colors.subbedText, fontWeight: 'bold' }}
          >{`MAX`}</StyledText>
        </Pressable>
      </View>
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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

/*
const AvailableGasDetail = ({ availableGas }: { availableGas: Balance }) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText
        style={{ color: colors.subbedText }}
      >{`Available gas`}</StyledText>
      <StyledText style={{ color: colors.subbedText }}>
        {availableGas.formatted}
      </StyledText>
    </View>
  );
};
*/

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
  const [amountInputText, setAmountInputText] = useState<string>('');

  const [isBalanceSufficient, setIsBalanceSufficient] = useState<boolean>(true);

  const [isReadyToConfirm, setIsReadyToConfirm] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'token' | 'usd'>('token');

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
  /// Mutations
  ///

  const { mutateAsync: sendAggregateTx, isPending: isSending } = useSend();

  ///
  /// Effects
  ///

  useEffect(() => {
    if (amountInputText !== '' && aggregatedSend && tokenBalance) {
      const parsedAmount = parseUnits(amountInputText, token.decimals);

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
  }, [amountInputText, aggregatedSend, tokenBalance]);

  useEffect(() => {
    if (tokenBalance) {
      const _isBalanceSufficient =
        parseUnits(amountInputText, token.decimals) <=
        BigInt(tokenBalance.balance);

      setIsBalanceSufficient(_isBalanceSufficient);
    }
  }, [amountInputText, tokenBalance]);

  useEffect(() => {
    if (containsNonNumericCharacters(amountInputText)) {
      return;
    }

    const parsedAmount = parseUnits(amountInputText, token.decimals);

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
  }, [amountInputText, fromAddresses, toAddress, chainId]);

  ///
  /// Handlers
  ///

  const amountInputTextChange = (amountText: string) => {
    setAmountInputText(amountText);
  };

  const onReviewButtonPress = () => {
    setIsReadyToConfirm(true);
  };

  const onConfirmButtonPress = async () => {
    if (!aggregatedSend) {
      throw new Error('aggregatedSend is undefined');
    }

    await sendAggregateTx({
      aggregatedSend,
      chainId,
    });

    navigation.navigate('Tabs', {
      screen: 'History',
    });
  };

  const onMaxBalancePress = () => {
    if (tokenBalance) {
      const amountText = formatUnits(
        BigInt(tokenBalance.balance),
        token.decimals
      );
      setAmountInputText(amountText);
    }
  };

  let subAmount: string | undefined;

  if (tokenPriceUsd !== undefined) {
    if (amountInputText !== '') {
      if (inputMode === 'token') {
        subAmount = new BigNumber(amountInputText)
          .multipliedBy(tokenPriceUsd)
          .toFixed(2);
      } else {
        const tokenAmountRaw = new BigNumber(amountInputText).dividedBy(
          tokenPriceUsd
        );
        subAmount = formatAmount(
          parseUnits(tokenAmountRaw.toString(), token.decimals).toString(),
          token.decimals
        );
      }
    }
  }

  const isReadyForReview = isBalanceSufficient && aggregatedSend !== undefined;

  return (
    <ScrollView contentContainerStyle={{ flex: 1, padding: 16, rowGap: 20 }}>
      <SendToCard toAddress={toAddress} />
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'flex-end',
          rowGap: 8,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 32,
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 8,
          }}
        >
          <TokenLogoWithChain
            logoURI={token.logoURI}
            chainId={chainId}
            size={42}
          />
          <TextInput
            keyboardType="numeric"
            value={amountInputText}
            autoFocus
            onChangeText={amountInputTextChange}
            placeholder={'0.00'}
            style={{
              fontSize: fontSizes.twoXLarge,
              flexShrink: 1,
              width: '100%',
              height: 56,
            }}
            numberOfLines={1}
          />
          <StyledText
            style={{ fontSize: fontSizes.twoXLarge, color: colors.border }}
          >
            {inputMode === 'token' ? token.symbol : 'USD'}
          </StyledText>
        </View>
        <View>
          {subAmount &&
            (inputMode === 'usd' ? (
              <StyledText
                style={{
                  color: colors.subbedText,
                  fontWeight: 'bold',
                }}
              >
                {`$${subAmount}`}
              </StyledText>
            ) : (
              <StyledText
                style={{
                  color: colors.subbedText,
                  fontWeight: 'bold',
                }}
              >
                {`${subAmount} ${token.symbol}`}
              </StyledText>
            ))}
        </View>
        <FeedbackPressable
          onPress={() => {
            if (inputMode === 'token') {
              setInputMode('usd');
            } else {
              setInputMode('token');
            }
          }}
        >
          <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
            {`Switch to ${inputMode === 'token' ? 'USD' : token.symbol}`}
          </StyledText>
        </FeedbackPressable>
      </View>
      {/** Details */}
      <View
        style={{
          flexDirection: 'column',
          rowGap: 12,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 32,
          padding: 16,
        }}
      >
        <BalanceDetail
          balance={tokenBalance ?? undefined}
          onMaxPress={onMaxBalancePress}
        />
        <SendFromDetail address={fromAddresses[0]} />
        <GasInfo
          gas={estimatedTransferGas}
          isFetchingGasInfo={isFetchingGasInfo}
        />
      </View>
      {isReadyToConfirm ? (
        <ConfirmButton onPress={onConfirmButtonPress} isLoading={isSending} />
      ) : (
        <ReviewButton
          onPress={onReviewButtonPress}
          isLoading={isBuildingAggregatedSend}
          isBalanceSufficient={isBalanceSufficient}
          isReadyForReview={isReadyForReview}
        />
      )}
    </ScrollView>
  );
};

export default SelectAmount;
