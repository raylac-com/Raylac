import Blockie from '@/components/Blockie/Blockie';
import SendDetailsSheet from '@/components/SendDetailsSheet/SendDetailsSheet';
import Skeleton from '@/components/Skeleton/Skeleton';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useUserAccount from '@/hooks/useUserAccount';
import { getPrivateKey } from '@/lib/key';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { getChainIcon, shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import {
  BuildMultiChainSendRequestBody,
  SendTransactionRequestBody,
  SignedBridgeStep,
  SignedTransferStep,
  signEIP1159Tx,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

type Props = Pick<
  NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>,
  'route'
>;

const ConfirmSend = ({ route }: Props) => {
  const { address: to, amount, token, outputChainId } = route.params;
  const insets = useSafeAreaInsets();

  const { data: userAccount } = useUserAccount();

  ///
  /// Local state
  ///

  const [isSendDetailsSheetOpen, setIsSendDetailsSheetOpen] = useState(false);

  ///
  /// Queries
  ///

  const {
    data: multiChainSend,
    mutateAsync: buildMultiChainSend,
    isPending: isBuildingMultiChainSend,
  } = trpc.buildMultiChainSend.useMutation({
    throwOnError: true,
  });

  ///
  /// Mutations
  ///

  const { mutateAsync: sendTransaction, isPending: isSendingTransaction } =
    trpc.sendTransaction.useMutation();

  ///
  /// Effects
  ///

  useEffect(() => {
    if (!userAccount) {
      return;
    }

    const parsedAmount = parseUnits(amount, token.decimals);

    const buildMultiChainSendRequestBody: BuildMultiChainSendRequestBody = {
      token,
      amount: parsedAmount.toString(),
      destinationChainId: outputChainId,
      sender: userAccount.address,
      to,
    };

    buildMultiChainSend(buildMultiChainSendRequestBody);
  }, [userAccount]);

  ///
  /// Handlers
  ///

  const onSendPress = async () => {
    if (!userAccount) {
      throw new Error('User account not loaded');
    }

    if (!multiChainSend) {
      throw new Error('Multi chain send not built');
    }

    // TODO: Sign and send
    const privateKey = await getPrivateKey();

    if (!privateKey) {
      throw new Error('Private key not found');
    }

    const privateKeyAccount = privateKeyToAccount(privateKey);

    const signedBridgeSteps: SignedBridgeStep[] = [];
    for (const step of multiChainSend.bridgeSteps) {
      const signature = await signEIP1159Tx({
        tx: step.tx,
        account: privateKeyAccount,
      });

      signedBridgeSteps.push({
        ...step,
        signature,
      });
    }

    const signature = await signEIP1159Tx({
      tx: multiChainSend.transferStep.tx,
      account: privateKeyAccount,
    });

    const signedTransferStep: SignedTransferStep = {
      ...multiChainSend.transferStep,
      signature,
    };

    const parsedAmount = parseUnits(amount, token.decimals);

    const sendTransactionRequestBody: SendTransactionRequestBody = {
      signedBridgeSteps,
      signedTransfer: signedTransferStep,
      sender: userAccount.address,
      token,
      amount: parsedAmount.toString(),
    };

    await sendTransaction(sendTransactionRequestBody);
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: 48,
          paddingHorizontal: 16,
          rowGap: 16,
          paddingBottom: insets.bottom,
        }}
      >
        <View style={{ flexDirection: 'column', rowGap: 74 }}>
          <View style={{ flexDirection: 'column', rowGap: 24 }}>
            {/* Send input details */}
            <View
              style={{
                flexDirection: 'column',
                rowGap: 12,
                borderColor: colors.border,
                borderWidth: 1,
                padding: 16,
                borderRadius: 16,
              }}
            >
              <StyledText>{`You send`}</StyledText>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {multiChainSend === undefined ? (
                  <Skeleton style={{ width: 100, height: 24 }} />
                ) : (
                  <StyledText>{`${multiChainSend.inputAmountFormatted} ${token.symbol}`}</StyledText>
                )}
                <StyledText
                  style={{ color: colors.subbedText }}
                  onPress={() => setIsSendDetailsSheetOpen(true)}
                >
                  {`Details`}
                </StyledText>
              </View>
            </View>
            {/* Send output details */}
            <View
              style={{
                flexDirection: 'column',
                rowGap: 12,
                borderColor: colors.border,
                borderWidth: 1,
                padding: 16,
                borderRadius: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 4,
                }}
              >
                <Blockie address={to} size={24} />
                <StyledText>{shortenAddress(to)}</StyledText>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 4,
                }}
              >
                <StyledText>{`Receives `}</StyledText>
                {multiChainSend === undefined ? (
                  <Skeleton style={{ width: 100, height: 24 }} />
                ) : (
                  <StyledText>{`${multiChainSend.outputAmountFormatted} ${token.symbol}`}</StyledText>
                )}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 4,
                }}
              >
                <StyledText>{`Network `}</StyledText>
                <Image
                  source={getChainIcon(outputChainId)}
                  style={{ width: 24, height: 24 }}
                />
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'column', rowGap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                columnGap: 4,
              }}
            >
              <StyledText>{`Bridge fee`}</StyledText>
              {multiChainSend === undefined ? (
                <Skeleton style={{ width: 100, height: 24 }} />
              ) : (
                <StyledText>{`$${multiChainSend.bridgeFeeUsd}`}</StyledText>
              )}
            </View>
          </View>
        </View>
        <StyledButton
          title="Send"
          onPress={onSendPress}
          isLoading={isSendingTransaction || isBuildingMultiChainSend}
          disabled={isSendingTransaction || isBuildingMultiChainSend}
        />
      </View>
      {multiChainSend && isSendDetailsSheetOpen && (
        <SendDetailsSheet
          sendDetails={multiChainSend}
          token={token}
          onClose={() => setIsSendDetailsSheetOpen(false)}
        />
      )}
    </View>
  );
};

export default ConfirmSend;
