import Feather from '@expo/vector-icons/Feather';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useUserAccount from '@/hooks/useUserAccount';
import { getPrivateKey } from '@/lib/key';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import {
  BuildAggregateSendRequestBody,
  formatAmount,
  SendAggregateTxRequestBody,
  signEIP1159Tx,
  Token,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hex, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const RecipientCard = ({
  toAddress,
  token,
  amount,
}: {
  toAddress: Hex;
  token: Token;
  amount: string;
}) => {
  const parsedAmount = parseUnits(amount, token.decimals);
  const formattedAmount = formatAmount(parsedAmount.toString(), token.decimals);

  return (
    <View
      style={{
        flexDirection: 'column',
        rowGap: 16,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 32,
        paddingHorizontal: 22,
        paddingVertical: 20,
      }}
    >
      <StyledText style={{ fontWeight: 'bold', color: colors.border }}>
        {shortenAddress(toAddress)}
      </StyledText>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <Image source={token.logoURI} style={{ width: 34, height: 34 }} />
        <StyledText style={{ fontWeight: 'bold', fontSize: fontSizes.large }}>
          {formattedAmount} {token.symbol}
        </StyledText>
      </View>
    </View>
  );
};

const InputCard = ({
  token,
  address,
  amount,
}: {
  token: Token;
  address: Hex;
  amount: string;
}) => {
  const parsedAmount = parseUnits(amount, token.decimals);
  const formattedAmount = formatAmount(parsedAmount.toString(), token.decimals);

  return (
    <View
      style={{
        flexDirection: 'column',
        rowGap: 16,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 32,
        paddingHorizontal: 22,
        paddingVertical: 20,
      }}
    >
      <StyledText style={{ fontWeight: 'bold', color: colors.border }}>
        {shortenAddress(address)}
      </StyledText>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <Image source={token.logoURI} style={{ width: 34, height: 34 }} />
        <StyledText style={{ fontWeight: 'bold', fontSize: fontSizes.large }}>
          {formattedAmount} {token.symbol}
        </StyledText>
      </View>
    </View>
  );
};

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
          justifyContent: 'flex-end',
          paddingTop: 48,
          paddingHorizontal: 16,
          rowGap: 48,
          paddingBottom: insets.bottom,
        }}
      >
        <View style={{ flexDirection: 'column', rowGap: 16 }}>
          <RecipientCard toAddress={toAddress} token={token} amount={amount} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="chevrons-up" size={36} color={colors.border} />
          </View>
          <InputCard token={token} address={fromAddresses[0]} amount={amount} />
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
