import Blockie from '@/components/Blockie/Blockie';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useUserAccount from '@/hooks/useUserAccount';
import { getPrivateKey } from '@/lib/key';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { getChainIcon, shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import {
  BuildAggregateSendRequestBody,
  SendAggregateTxRequestBody,
  signEIP1159Tx,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hex, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

type Props = Pick<
  NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>,
  'route'
>;

const ConfirmSend = ({ route }: Props) => {
  const { toAddress, fromAddresses, amount, token, chainId } = route.params;
  const insets = useSafeAreaInsets();

  const { data: userAccount } = useUserAccount();

  ///
  /// Queries
  ///

  const {
    data: aggregatedSend,
    mutateAsync: buildAggregatedSend,
    isPending: isBuildingAggregatedSend,
  } = trpc.buildAggregateSend.useMutation({
    throwOnError: true,
  });

  ///
  /// Mutations
  ///

  const { mutateAsync: sendAggregateTx, isPending: isSendingAggregateTx } =
    trpc.sendAggregateTx.useMutation();

  ///
  /// Effects
  ///

  useEffect(() => {
    if (!userAccount) {
      return;
    }

    const parsedAmount = parseUnits(amount, token.decimals);

    const buildAggregateSendRequestBody: BuildAggregateSendRequestBody = {
      token,
      amount: parsedAmount.toString(),
      chainId: chainId,
      fromAddresses,
      toAddress,
    };

    buildAggregatedSend(buildAggregateSendRequestBody);
  }, [userAccount]);

  ///
  /// Handlers
  ///

  const onSendPress = async () => {
    if (!userAccount) {
      throw new Error('User account not loaded');
    }

    if (!aggregatedSend) {
      throw new Error('Aggregated send not built');
    }

    const privateKey = await getPrivateKey(fromAddresses[0]);

    if (!privateKey) {
      throw new Error('Private key not found');
    }

    const privateKeyAccount = privateKeyToAccount(privateKey);

    const signedTxs: Hex[] = [];
    for (const step of aggregatedSend.inputs) {
      const singedTx = await signEIP1159Tx({
        tx: step.tx,
        account: privateKeyAccount,
      });

      signedTxs.push(singedTx);
    }

    const sendAggregateTxRequestBody: SendAggregateTxRequestBody = {
      signedTxs,
      chainId: chainId,
    };

    await sendAggregateTx(sendAggregateTxRequestBody);
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
              ></View>
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
                  <Blockie address={toAddress} size={24} />
                  <StyledText>{shortenAddress(toAddress)}</StyledText>
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
                    source={getChainIcon(chainId)}
                    style={{ width: 24, height: 24 }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
        <StyledButton
          title="Send"
          onPress={onSendPress}
          isLoading={isSendingAggregateTx || isBuildingAggregatedSend}
          disabled={isSendingAggregateTx || isBuildingAggregatedSend}
        />
      </View>
    </View>
  );
};

export default ConfirmSend;
