import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import {
  Balance,
  BuildBridgeSendRequestBody,
  BuildSendRequestBody,
  ETH,
  formatAmount,
  Token,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { formatUnits, Hex, parseUnits } from 'viem';
import BigNumber from 'bignumber.js';
import { trpc } from '@/lib/trpc';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import useTokenPriceUsd from '@/hooks/useTokenPriceUsd';
import Skeleton from '@/components/Skeleton/Skeleton';
import SendToCard from '@/components/SendToCard/SendToCard';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import useSend from '@/hooks/useSend';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';
import { getChainIcon } from '@/lib/utils';
import SelectChainSheet from '@/components/SelectChainSheet/SelectChainSheet';
import useBridgeSend from '@/hooks/useBridgeSend';
import useAddressChainTokenBalance from '@/hooks/useAddressChainTokenBalance';

const ConfirmButton = ({
  onPress,
  isLoading,
}: {
  onPress: () => void;
  isLoading: boolean;
}) => {
  return (
    <StyledButton title="Confirm" onPress={onPress} isLoading={isLoading} />
  );
};

const ReviewButton = ({
  onPress,
  isLoading,
  isBalanceSufficient,
  isGasSufficient,
  isReadyForReview,
}: {
  onPress: () => void;
  isLoading: boolean;
  isBalanceSufficient: boolean;
  isGasSufficient: boolean;
  isReadyForReview: boolean;
}) => {
  let label = 'Review';

  if (!isBalanceSufficient) {
    label = 'Insufficient balance';
  } else if (!isGasSufficient) {
    label = 'Insufficient gas';
  }

  return (
    <StyledButton
      disabled={!isBalanceSufficient || !isGasSufficient || !isReadyForReview}
      isLoading={isLoading}
      variant="outline"
      title={label}
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

const ChainDetail = ({
  chainId,
  onSelectPress,
}: {
  chainId: number;
  onSelectPress: () => void;
}) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText
        style={{ color: colors.subbedText }}
      >{`Recipient receives on`}</StyledText>
      <FeedbackPressable onPress={onSelectPress}>
        <Image
          source={getChainIcon(chainId)}
          style={{ width: 24, height: 24 }}
        />
      </FeedbackPressable>
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

const BridgeFeeInfo = ({
  feeToken,
  feeChainId,
  bridgeFee,
}: {
  feeToken: Token;
  feeChainId: number;
  bridgeFee: Balance | undefined;
}) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText
        style={{ color: colors.subbedText }}
      >{`Bridge fee`}</StyledText>
      {bridgeFee ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
        >
          <TokenLogoWithChain
            logoURI={feeToken.logoURI}
            chainId={feeChainId}
            size={24}
          />
          <StyledText style={{ color: colors.subbedText }}>
            {`$${bridgeFee.usdValueFormatted}`}
          </StyledText>
        </View>
      ) : (
        <Skeleton style={{ width: 100, height: 20 }} />
      )}
    </View>
  );
};

const AvailableGasDetail = ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const ethBalance = useAddressChainTokenBalance({
    address,
    chainId,
    token: ETH,
  });

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText
        style={{ color: colors.subbedText }}
      >{`Available gas`}</StyledText>
      {ethBalance ? (
        <StyledText style={{ color: colors.subbedText }}>
          {`$${ethBalance.usdValueFormatted} (${ethBalance.formatted} ETH)`}
        </StyledText>
      ) : (
        <Skeleton style={{ width: 100, height: 20 }} />
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
  const _chainId = route.params.chainId;

  const [isChainsSheetOpen, setIsChainsSheetOpen] = useState(false);

  const [fromChainId, _setFromChainId] = useState<number>(_chainId);
  const [toChainId, setToChainId] = useState<number>(_chainId);

  ///
  /// Local state
  ///
  const [amountInputText, setAmountInputText] = useState<string>('');

  const [isBalanceSufficient, setIsBalanceSufficient] = useState<boolean>(true);
  const [isGasSufficient, setIsGasSufficient] = useState<boolean>(true);

  const [isReadyToConfirm, setIsReadyToConfirm] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'token' | 'usd'>('usd');

  ///
  /// Queries
  ///

  const tokenBalance = useAddressChainTokenBalance({
    chainId: fromChainId,
    token,
    address: fromAddresses[0],
  });

  const ethBalance = useAddressChainTokenBalance({
    address: fromAddresses[0],
    chainId: fromChainId,
    token: ETH,
  });

  const { data: tokenPriceUsd } = useTokenPriceUsd(token);

  ///
  /// Mutations
  ///

  const {
    data: sendData,
    mutateAsync: buildSend,
    isPending: isBuildingSend,
  } = trpc.buildSend.useMutation({
    throwOnError: false,
  });

  const {
    data: bridgeSendData,
    mutateAsync: buildBridgeSend,
    isPending: isBuildingBridgeSend,
  } = trpc.buildBridgeSend.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: sendTx, isPending: isSending } = useSend();
  const { mutateAsync: sendBridgeTx, isPending: isSendingBridgeTx } =
    useBridgeSend();

  ///
  /// Effects
  ///

  useEffect(() => {
    if (tokenBalance && tokenPriceUsd !== null && tokenPriceUsd !== undefined) {
      if (inputMode === 'token') {
        const _isBalanceSufficient =
          parseUnits(amountInputText, token.decimals) <=
          BigInt(tokenBalance.balance);

        setIsBalanceSufficient(_isBalanceSufficient);
      } else {
        const _isBalanceSufficient =
          new BigNumber(amountInputText).dividedBy(tokenPriceUsd) <=
          new BigNumber(tokenBalance.balance);

        setIsBalanceSufficient(_isBalanceSufficient);
      }
    }
  }, [amountInputText, tokenBalance, tokenPriceUsd]);

  useEffect(() => {
    if (ethBalance !== undefined && tokenBalance !== undefined) {
      if (sendData) {
        const sendGas = BigInt(sendData.transfer.gasFee.balance);
        setIsGasSufficient(sendGas <= BigInt(ethBalance.balance));
      }

      if (bridgeSendData) {
        const bridgeFee = BigInt(bridgeSendData.relayerServiceFee.balance);

        if (bridgeSendData.relayerServiceFeeToken.symbol === 'ETH') {
          setIsGasSufficient(bridgeFee <= BigInt(ethBalance.balance));
        } else {
          setIsGasSufficient(bridgeFee <= BigInt(tokenBalance.balance));
        }
      }
    }
  }, [sendData, bridgeSendData, ethBalance]);

  useEffect(() => {
    if (containsNonNumericCharacters(amountInputText)) {
      return;
    }

    if (tokenPriceUsd === null || tokenPriceUsd === undefined) {
      return;
    }

    if (amountInputText === '') {
      return;
    }

    const parsedAmount =
      inputMode === 'token'
        ? parseUnits(amountInputText, token.decimals)
        : parseUnits(
            new BigNumber(amountInputText).dividedBy(tokenPriceUsd).toString(),
            token.decimals
          );

    if (parsedAmount === BigInt(0)) {
      return;
    }

    if (fromChainId === toChainId) {
      const buildAggregatedSendRequestBody: BuildSendRequestBody = {
        token,
        amount: parsedAmount.toString(),
        fromAddress: fromAddresses[0],
        toAddress,
        chainId: fromChainId,
      };

      buildSend(buildAggregatedSendRequestBody);
    } else {
      const buildBridgeSendRequestBody: BuildBridgeSendRequestBody = {
        token,
        amount: parsedAmount.toString(),
        from: fromAddresses[0],
        to: toAddress,
        fromChainId,
        toChainId,
      };

      buildBridgeSend(buildBridgeSendRequestBody);
    }
  }, [amountInputText, fromAddresses, toAddress, fromChainId, toChainId]);

  useEffect(() => {
    if (sendData) {
      setIsReadyToConfirm(false);
    }
  }, [sendData]);

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
    if (fromChainId !== toChainId) {
      if (!bridgeSendData) {
        throw new Error('bridgeSendData is undefined');
      }

      await sendBridgeTx({
        sendData: bridgeSendData,
        chainId: fromChainId,
      });
    } else {
      if (!sendData) {
        throw new Error('sendData is undefined');
      }

      await sendTx({
        sendData: sendData,
        chainId: fromChainId,
      });
    }

    Toast.show({
      type: 'success',
      text1: 'Sent',
      text2: 'Your transaction has been sent',
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

  if (tokenPriceUsd !== undefined && tokenPriceUsd !== null) {
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

  const isReadyForReview = isBalanceSufficient && sendData !== undefined;

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
            chainId={fromChainId}
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
            (inputMode === 'token' ? (
              <StyledText
                style={{
                  color: colors.subbedText,
                  fontWeight: 'bold',
                }}
              >
                {`~$${subAmount}`}
              </StyledText>
            ) : (
              <StyledText
                style={{
                  color: colors.subbedText,
                  fontWeight: 'bold',
                }}
              >
                {`~${subAmount} ${token.symbol}`}
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
        <ChainDetail
          chainId={toChainId}
          onSelectPress={() => setIsChainsSheetOpen(true)}
        />
        <SendFromDetail address={fromAddresses[0]} />
        <GasInfo
          gas={bridgeSendData?.originChainGas || sendData?.transfer.gasFee}
          isFetchingGasInfo={isBuildingBridgeSend || isBuildingSend}
        />
        {bridgeSendData && (
          <BridgeFeeInfo
            bridgeFee={bridgeSendData?.relayerServiceFee}
            feeToken={bridgeSendData?.relayerServiceFeeToken}
            feeChainId={bridgeSendData?.relayerFeeChainId}
          />
        )}
        <AvailableGasDetail address={fromAddresses[0]} chainId={fromChainId} />
      </View>
      {isReadyToConfirm ? (
        <ConfirmButton
          onPress={onConfirmButtonPress}
          isLoading={isSending || isSendingBridgeTx}
        />
      ) : (
        <ReviewButton
          onPress={onReviewButtonPress}
          isLoading={isBuildingSend || isBuildingBridgeSend}
          isBalanceSufficient={isBalanceSufficient}
          isGasSufficient={isGasSufficient}
          isReadyForReview={isReadyForReview}
        />
      )}
      <SelectChainSheet
        open={isChainsSheetOpen}
        onSelect={chain => {
          setToChainId(chain.id);
          setIsChainsSheetOpen(false);
        }}
      />
    </ScrollView>
  );
};

export default SelectAmount;
