import Feather from '@expo/vector-icons/Feather';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useUserAccount from '@/hooks/useUserAccount';
import { getPrivateKey } from '@/lib/key';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import {
  BuildAggregateSendRequestBody,
  SendAggregateTxRequestBody,
  signEIP1159Tx,
  Token,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import { Balance } from '@raylac/shared';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';
import useSend from '@/hooks/useSend';

const RecipientCard = ({
  toAddress,
  token,
  amount,
  chainId,
}: {
  toAddress: Hex;
  token: Token;
  amount: Balance;
  chainId: number;
}) => {
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
      <WalletIconAddress address={toAddress} />
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
      >
        <TokenLogoWithChain
          logoURI={token.logoURI}
          chainId={chainId}
          size={34}
        />
        <View style={{ flexDirection: 'column' }}>
          <StyledText style={{ fontWeight: 'bold', fontSize: fontSizes.large }}>
            {`$${amount.usdValueFormatted}`}
          </StyledText>
          <StyledText style={{ color: colors.border }}>
            {amount.formatted} {token.symbol}
          </StyledText>
        </View>
      </View>
    </View>
  );
};

const InputCard = ({
  token,
  address,
  amount,
  chainId,
}: {
  token: Token;
  address: Hex;
  amount: Balance;
  chainId: number;
}) => {
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
      <WalletIconAddress address={address} />
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
      >
        <TokenLogoWithChain
          logoURI={token.logoURI}
          chainId={chainId}
          size={42}
        />
        <View style={{ flexDirection: 'column' }}>
          <StyledText style={{ fontWeight: 'bold', fontSize: fontSizes.large }}>
            {`$${amount.usdValueFormatted}`}
          </StyledText>
          <StyledText style={{ color: colors.border }}>
            {amount.formatted} {token.symbol}
          </StyledText>
        </View>
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

  const navigation = useTypedNavigation();
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
    useSend();

  ///
  /// Effects
  ///

  useEffect(() => {
    if (!userAccount) {
      return;
    }

    const buildAggregateSendRequestBody: BuildAggregateSendRequestBody = {
      token,
      amount: amount.balance,
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
      transfer: {
        token,
        amount: amount,
        from: fromAddresses[0],
        to: toAddress,
      },
    };

    await sendAggregateTx(sendAggregateTxRequestBody);

    navigation.navigate('Tabs', { screen: 'History' });
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
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View style={{ flexDirection: 'column', rowGap: 16 }}>
          <RecipientCard
            toAddress={toAddress}
            token={token}
            amount={amount}
            chainId={chainId}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="chevrons-up" size={36} color={colors.border} />
          </View>
          <InputCard
            token={token}
            address={fromAddresses[0]}
            amount={amount}
            chainId={chainId}
          />
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
