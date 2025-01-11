import Feather from '@expo/vector-icons/Feather';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { useTranslation } from 'react-i18next';
import fontSizes from '@/lib/styles/fontSizes';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import {
  TokenAmount,
  BuildBridgeSendRequestBody,
  BuildSendRequestBody,
  ETH,
  formatAmount,
  containsNonNumericCharacters,
  BuildBridgeSendReturnType,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import BigNumber from 'bignumber.js';
import { trpc } from '@/lib/trpc';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import useTokenPriceUsd from '@/hooks/useTokenPriceUsd';
import Skeleton from '@/components/Skeleton/Skeleton';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import useSend from '@/hooks/useSend';
import Toast from 'react-native-toast-message';

import ChainLogo from '@/components/ChainLogo/ChainLogo';
import SelectChainSheet from '@/components/SelectChainSheet/SelectChainSheet';
import useBridgeSend from '@/hooks/useBridgeSend';
import useAddressChainTokenBalance from '@/hooks/useAddressChainTokenBalance';
import SendConfirmSheet from '@/components/SendConfirmSheet/SendConfirmSheet';
import { checkIsBalanceSufficient } from '@raylac/shared';
import BridgeSendFeeDetailsSheet from '@/components/BridgeSendFeeDetailsSheet/BridgeSendFeeDetailsSheet';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';

const ReviewButton = ({
  onPress,
  isIdle,
  isLoading,
  isBalanceSufficient,
  isGasSufficient,
}: {
  onPress: () => void;
  isIdle: boolean;
  isLoading: boolean;
  isBalanceSufficient: boolean;
  isGasSufficient: boolean;
}) => {
  let label = 'Review';

  if (!isBalanceSufficient) {
    label = 'Insufficient balance';
  } else if (!isGasSufficient) {
    label = 'Insufficient gas';
  }

  return (
    <StyledButton
      disabled={!isBalanceSufficient || !isGasSufficient || isLoading || isIdle}
      isLoading={isLoading}
      title={label}
      onPress={onPress}
    />
  );
};

const ChainDetail = ({
  chainId,
  onSelectPress,
}: {
  chainId: number;
  onSelectPress: () => void;
}) => {
  const { t } = useTranslation('SelectAmount');
  return (
    <FeedbackPressable
      style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      onPress={onSelectPress}
    >
      <StyledText style={{ color: colors.subbedText }}>
        {t('recipientReceivesOn')}
      </StyledText>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 2 }}
      >
        <ChainLogo chainId={chainId} size={24} />
        <Feather name="chevron-right" size={16} color={colors.border} />
      </View>
    </FeedbackPressable>
  );
};

const BalanceDetail = ({
  balance,
  onMaxPress,
}: {
  balance: TokenAmount | undefined;
  onMaxPress: () => void;
}) => {
  const { t } = useTranslation('SelectAmount');
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText style={{ color: colors.subbedText }}>
        {t('balance')}
      </StyledText>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        {balance ? (
          <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
            {`$${balance.usdValueFormatted}`}
          </StyledText>
        ) : (
          <Skeleton style={{ width: 100, height: 20 }} />
        )}
        <FeedbackPressable onPress={onMaxPress}>
          <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
            {t('max')}
          </StyledText>
        </FeedbackPressable>
      </View>
    </View>
  );
};

const GasInfo = ({
  gas,
  isFetchingGasInfo,
}: {
  gas: TokenAmount;
  isFetchingGasInfo: boolean;
}) => {
  const { t } = useTranslation('SelectAmount');
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <StyledText style={{ color: colors.subbedText }}>{t('gas')}</StyledText>
      {isFetchingGasInfo && <Skeleton style={{ width: 100, height: 20 }} />}
      {gas && (
        <StyledText style={{ color: colors.subbedText }}>
          {t('gasAmount', {
            amount: gas.usdValueFormatted,
            eth: gas.formatted,
          })}
        </StyledText>
      )}
    </View>
  );
};

const BridgeFeeInfo = ({
  bridgeSendData,
  isLoading,
}: {
  bridgeSendData: BuildBridgeSendReturnType | undefined;
  isLoading: boolean;
}) => {
  const { t } = useTranslation('SelectAmount');
  const [isFeeDetailsSheetOpen, setIsFeeDetailsSheetOpen] = useState(false);

  return (
    <View>
      <FeedbackPressable
        style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        onPress={() => setIsFeeDetailsSheetOpen(true)}
      >
        <StyledText style={{ color: colors.subbedText }}>
          {t('totalFee')}
        </StyledText>
        {isLoading && <Skeleton style={{ width: 100, height: 20 }} />}
        {bridgeSendData && (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
          >
            <StyledText style={{ color: colors.subbedText }}>
              {t('totalFeeAmount', { amount: bridgeSendData.totalFeeUsd })}
            </StyledText>
            <Feather name="chevron-right" size={16} color={colors.border} />
          </View>
        )}
      </FeedbackPressable>
      {bridgeSendData && (
        <BridgeSendFeeDetailsSheet
          isOpen={isFeeDetailsSheetOpen}
          bridgeSendData={bridgeSendData}
          onClose={() => setIsFeeDetailsSheetOpen(false)}
        />
      )}
    </View>
  );
};

/*
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
*/

type Props = Pick<
  NativeStackScreenProps<RootStackParamsList, 'SelectAmount'>,
  'route'
>;

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
  const [amountInputText, setAmountInputText] = useState<string>('1');
  const [subAmount, setSubAmount] = useState<string | null>(null);

  const [isBalanceSufficient, setIsBalanceSufficient] = useState<boolean>(true);
  const [isGasSufficient, setIsGasSufficient] = useState<boolean>(true);

  const [inputMode, setInputMode] = useState<'token' | 'usd'>('usd');
  const [isConfirmSheetOpen, setIsConfirmSheetOpen] = useState<boolean>(false);

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
    reset: resetSendData,
  } = trpc.buildSend.useMutation({
    throwOnError: false,
  });

  const {
    data: bridgeSendData,
    mutateAsync: buildBridgeSend,
    isPending: isBuildingBridgeSend,
    reset: resetBridgeSendData,
  } = trpc.buildBridgeSend.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: sendTx, isPending: isSending } = useSend();
  const { mutateAsync: sendBridgeTx, isPending: isSendingBridgeTx } =
    useBridgeSend();

  ///
  /// Effects
  ///

  // Hook to check if the balance is sufficient
  useEffect(() => {
    if (
      amountInputText !== '' &&
      !containsNonNumericCharacters(amountInputText) &&
      tokenBalance !== undefined
    ) {
      const _isBalanceSufficient = checkIsBalanceSufficient(
        amountInputText,
        tokenBalance,
        inputMode,
        token
      );

      setIsBalanceSufficient(_isBalanceSufficient);
    }
  }, [amountInputText, tokenBalance, inputMode]);

  // Hook to check if the gas is sufficient
  useEffect(() => {
    if (ethBalance !== undefined && tokenBalance !== undefined) {
      if (sendData) {
        // This is a same-chain transfer
        // We simple need to check if the gas fee is less than the available gas
        const sendGas = BigInt(sendData.transfer.gasFee.amount);

        if (token.id === zeroAddress) {
          // This is a ETH transfer
          // Add the send amount and the gas fee
          const sendAmountPlusGas =
            BigInt(sendData.transfer.amount.amount) + sendGas;

          // Check if the send amount plus the gas fee is less than the available gas
          setIsGasSufficient(sendAmountPlusGas <= BigInt(ethBalance.amount));
        } else {
          setIsGasSufficient(sendGas <= BigInt(ethBalance.amount));
        }
      }

      if (bridgeSendData) {
        const originChainGas = BigInt(bridgeSendData.originChainGas.amount);

        // This is a cross-chain transfer
        if (token.id === zeroAddress) {
          // This is a ETH transfer
          // Add the send amount and the gas fee
          const sendAmountPlusGas =
            BigInt(bridgeSendData.amountIn.amount) +
            BigInt(bridgeSendData.originChainGas.amount);

          // Check if the send amount plus the gas fee is less than the available gas
          setIsGasSufficient(sendAmountPlusGas <= BigInt(ethBalance.amount));
        } else {
          setIsGasSufficient(originChainGas <= BigInt(ethBalance.amount));
        }
      }
    }
  }, [sendData, bridgeSendData, ethBalance]);

  // Hook to build the send data
  useEffect(() => {
    if (
      amountInputText === '' ||
      containsNonNumericCharacters(amountInputText) ||
      tokenPriceUsd === null ||
      tokenPriceUsd === undefined
    ) {
      return;
    }

    const parsedAmount =
      inputMode === 'token'
        ? parseUnits(amountInputText, token.decimals)
        : parseUnits(
            new BigNumber(amountInputText).dividedBy(tokenPriceUsd).toFixed(),
            token.decimals
          );

    if (parsedAmount === BigInt(0)) {
      return;
    }

    resetBridgeSendData();
    resetSendData();

    if (fromChainId === toChainId) {
      // This is a same-chain transfer
      const buildAggregatedSendRequestBody: BuildSendRequestBody = {
        token,
        amount: parsedAmount.toString(),
        fromAddress: fromAddresses[0],
        toAddress,
        chainId: fromChainId,
      };

      buildSend(buildAggregatedSendRequestBody);
    } else {
      // This is a cross-chain transfer
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

  // Hook to calculate the sub amount
  // (i.e. the amount in USD if the input is token amount,
  // or the amount in tokens if the input is USD amount)
  useEffect(() => {
    if (
      amountInputText !== '' &&
      !containsNonNumericCharacters(amountInputText) &&
      tokenPriceUsd !== null &&
      tokenPriceUsd !== undefined
    ) {
      if (inputMode === 'token') {
        const _subAmount = new BigNumber(amountInputText)
          .multipliedBy(tokenPriceUsd)
          .toFixed(2);

        setSubAmount(_subAmount);
      } else {
        const tokenAmountRaw = new BigNumber(amountInputText)
          .dividedBy(tokenPriceUsd)
          .toFixed();

        const _subAmount = formatAmount(
          parseUnits(tokenAmountRaw, token.decimals).toString(),
          token.decimals
        );

        setSubAmount(_subAmount);
      }
    }
  }, [amountInputText, tokenPriceUsd]);

  ///
  /// Handlers
  ///

  const amountInputTextChange = (amountText: string) => {
    setAmountInputText(amountText);
  };

  const onReviewButtonPress = () => {
    if (!isReadyForReview) {
      throw new Error('Not ready for review');
    }
    setIsConfirmSheetOpen(true);
  };

  const onConfirmButtonPress = async () => {
    if (fromChainId !== toChainId) {
      if (!bridgeSendData) {
        throw new Error('bridgeSendData is undefined');
      }

      const requestId = bridgeSendData.relayRequestId;

      await sendBridgeTx({
        sendData: bridgeSendData,
        chainId: fromChainId,
      });

      Toast.show({
        type: 'success',
        text1: 'Sent',
        text2: 'Your transaction has been sent',
      });

      navigation.navigate('Tabs', {
        screen: 'History',
        params: {
          pendingBridgeTransfer: {
            requestId,
            fromChainId,
            toChainId,
            from: fromAddresses[0],
            to: toAddress,
            amount: bridgeSendData.amountIn,
            token,
          },
        },
      });
    } else {
      if (!sendData) {
        throw new Error('sendData is undefined');
      }

      const txHash = await sendTx({
        sendData: sendData,
        chainId: fromChainId,
      });

      Toast.show({
        type: 'success',
        text1: 'Sent',
        text2: 'Your transaction has been sent',
      });

      navigation.navigate('Tabs', {
        screen: 'History',
        params: {
          pendingTransfer: {
            txHash,
            from: fromAddresses[0],
            to: toAddress,
            amount: sendData.transfer.amount,
            token: sendData.transfer.token,
            chainId: fromChainId,
          },
        },
      });
    }
  };

  const onMaxBalancePress = () => {
    if (tokenBalance) {
      if (inputMode === 'token') {
        const amountText = formatUnits(
          BigInt(tokenBalance.amount),
          token.decimals
        );
        setAmountInputText(amountText);
      } else {
        setAmountInputText(tokenBalance.usdValue);
      }
    }
  };

  const isReadyForReview =
    isBalanceSufficient &&
    isGasSufficient &&
    (sendData !== undefined || bridgeSendData !== undefined);

  return (
    <ScrollView contentContainerStyle={{ flex: 1, padding: 16, rowGap: 20 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          columnGap: 16,
        }}
      >
        <WalletIconAddress address={fromAddresses[0]} />
        <Feather name="chevrons-right" size={24} color={colors.border} />
        <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
          {shortenAddress(toAddress)}
        </StyledText>
      </View>
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
          rowGap: 16,
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
        {sendData && (
          <GasInfo
            gas={sendData.transfer.gasFee}
            isFetchingGasInfo={isBuildingSend}
          />
        )}
        {bridgeSendData && (
          <BridgeFeeInfo
            bridgeSendData={bridgeSendData}
            isLoading={isBuildingBridgeSend}
          />
        )}
      </View>
      <ReviewButton
        onPress={onReviewButtonPress}
        isIdle={!(sendData !== undefined || bridgeSendData !== undefined)}
        isLoading={isBuildingSend || isBuildingBridgeSend}
        isBalanceSufficient={isBalanceSufficient}
        isGasSufficient={isGasSufficient}
      />
      <SelectChainSheet
        title="Select recipient chain"
        open={isChainsSheetOpen}
        onSelect={chain => {
          setToChainId(chain.id);
          setIsChainsSheetOpen(false);
        }}
        onClose={() => {
          setIsChainsSheetOpen(false);
        }}
        token={token}
      />
      {isReadyForReview && (
        <SendConfirmSheet
          open={isConfirmSheetOpen}
          fromChainId={fromChainId}
          toChainId={toChainId}
          token={token}
          fromAddress={fromAddresses[0]}
          toAddress={toAddress}
          inputAmount={
            (sendData?.transfer.amount ||
              bridgeSendData?.amountIn) as TokenAmount
          }
          outputAmount={
            (sendData?.transfer.amount ||
              bridgeSendData?.amountOut) as TokenAmount
          }
          onClose={() => {
            setIsConfirmSheetOpen(false);
          }}
          onConfirm={onConfirmButtonPress}
          isSending={isSending || isSendingBridgeTx}
        />
      )}
    </ScrollView>
  );
};

export default SelectAmount;
