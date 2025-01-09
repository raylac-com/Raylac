import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';
import colors from '@/lib/styles/colors';
import {
  getChainFromId,
  signEIP1159Tx,
  Token,
  getAddressChainTokenBalance,
  BuildBridgeSendRequestBody,
  formatTokenAmount,
  SendBridgeTxRequestBody,
} from '@raylac/shared';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Hex, parseUnits } from 'viem';
import { trpc } from '@/lib/trpc';
import useUserAddresses from '@/hooks/useUserAddresses';
import fontSizes from '@/lib/styles/fontSizes';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import StyledText from '@/components/StyledText/StyledText';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoveFundsSheetStackParamsList } from '../MoveFundsSheet';
import ChainLogo from '@/components/ChainLogo/ChainLogo';
import { useMoveFundsContext } from '@/contexts/MoveFundsContext';
import StyledButton from '@/components/StyledButton/StyledButton';
import { getPrivateKey } from '@/lib/key';
import { privateKeyToAccount } from 'viem/accounts';
import useTokenPriceUsd from '@/hooks/useTokenPriceUsd';
import useTokenBalances from '@/hooks/useTokenBalances';

const AddressSelector = ({
  address,
  onPress,
}: {
  address: Hex | null;
  onPress: () => void;
}) => {
  return (
    <FeedbackPressable onPress={onPress}>
      {address ? (
        <WalletIconAddress address={address} />
      ) : (
        <StyledText>{`Select address`}</StyledText>
      )}
    </FeedbackPressable>
  );
};

const ChainSelector = ({
  chainId,
  onSelectPress,
}: {
  chainId: number;
  onSelectPress: () => void;
}) => {
  return (
    <View>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        onPress={onSelectPress}
      >
        <ChainLogo chainId={chainId} size={16} />
        <StyledText>{getChainFromId(chainId).name}</StyledText>
      </Pressable>
    </View>
  );
};

const MoveFundsOutput = ({
  toAddress,
  token,
  outputAmount,
  chainId,
}: {
  toAddress: Hex | null;
  token: Token | null;
  outputAmount: string | null;
  chainId: number | null;
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MoveFundsSheetStackParamsList>>();

  const onSelectOutputAddressPress = () => {
    navigation.navigate('SelectAddress', { type: 'to' });
  };

  const onSelectOutputChainPress = () => {
    navigation.navigate('SelectChain', { type: 'to' });
  };

  return (
    <View
      style={{
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 32,
        rowGap: 12,
      }}
    >
      <AddressSelector
        address={toAddress}
        onPress={onSelectOutputAddressPress}
      />
      <FeedbackPressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onPress={() => {}}
      >
        <TokenLogoWithChain
          logoURI={token?.logoURI ?? null}
          chainId={chainId}
          size={34}
        />
        <StyledText
          style={{
            color: colors.border,
            fontSize: fontSizes.twoXLarge,
          }}
        >
          {outputAmount ? outputAmount : '0.00'} {token?.symbol}
        </StyledText>
      </FeedbackPressable>
      {chainId && (
        <ChainSelector
          chainId={chainId}
          onSelectPress={onSelectOutputChainPress}
        />
      )}
    </View>
  );
};

const AmountInput = ({
  amountInputText,
  setAmountInputText,
}: {
  amountInputText: string;
  setAmountInputText: (amountInputText: string) => void;
}) => {
  return (
    <TextInput
      keyboardType="numeric"
      value={amountInputText}
      onChangeText={setAmountInputText}
      placeholder={'0.00'}
      style={{
        fontSize: fontSizes.twoXLarge,
        flexShrink: 1,
        width: '100%',
      }}
      numberOfLines={1}
    />
  );
};

const MoveFundsInput = ({
  fromAddress,
  token,
  chainId,
  amountInputText,
  setAmountInputText,
  onOpenSelectToken,
}: {
  fromAddress: Hex | null;
  token: Token | null;
  chainId: number | null;
  amountInputText: string;
  setAmountInputText: (amountInputText: string) => void;
  onOpenSelectToken: () => void;
}) => {
  const { data: userAddresses } = useUserAddresses();
  const { data: tokenBalances } = trpc.getTokenBalances.useQuery({
    addresses: userAddresses?.map(address => address.address) ?? [],
  });

  const navigation =
    useNavigation<NativeStackNavigationProp<MoveFundsSheetStackParamsList>>();

  const onSelectInputAddressPress = () => {
    navigation.navigate('SelectAddress', { type: 'from' });
  };

  const onSelectInputChainPress = () => {
    navigation.navigate('SelectChain', { type: 'from' });
  };

  const balance =
    tokenBalances && fromAddress && chainId && token
      ? getAddressChainTokenBalance({
          tokenBalances: tokenBalances,
          address: fromAddress,
          chainId: chainId,
          token: token,
        })
      : undefined;

  return (
    <View
      style={{
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 32,
        rowGap: 12,
      }}
    >
      <AddressSelector
        address={fromAddress}
        onPress={onSelectInputAddressPress}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TokenLogoWithChain
          logoURI={token?.logoURI ?? null}
          chainId={chainId}
          size={34}
        />
        <AmountInput
          amountInputText={amountInputText}
          setAmountInputText={setAmountInputText}
        />
        <FeedbackPressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={onOpenSelectToken}
        >
          <StyledText
            style={{
              fontSize: fontSizes.twoXLarge,
              color: colors.subbedText,
            }}
          >
            {token ? token.symbol : ''}
          </StyledText>
          <Ionicons
            name="chevron-expand-outline"
            size={24}
            color={colors.subbedText}
          />
        </FeedbackPressable>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <StyledText style={{ color: colors.subbedText }}>
          {balance ? balance.formatted : ''} {token?.symbol}
        </StyledText>
      </View>
      {chainId && (
        <ChainSelector
          chainId={chainId}
          onSelectPress={onSelectInputChainPress}
        />
      )}
    </View>
  );
};

const MoveFunds = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MoveFundsSheetStackParamsList>>();

  const {
    toAddress,
    setToAddress,
    fromAddress,
    setFromAddress,
    token,
    setToken,
    fromChainId,
    //    setFromChainId,
    toChainId,
    //    setToChainId,
  } = useMoveFundsContext();

  const [amountInputText, setAmountInputText] = useState('');

  const { data: userAddresses } = useUserAddresses();
  const { data: tokenBalances } = useTokenBalances();

  const {
    data: bridgeSend,
    mutateAsync: buildBridgeSend,
    isPending: isBuildingBridgeSend,
  } = trpc.buildBridgeSend.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: sendBridgeTx, isPending: isSendingBridgeTx } =
    trpc.sendBridgeTx.useMutation();

  const { data: tokenPriceUsd } = useTokenPriceUsd(token);

  useEffect(() => {
    if (tokenBalances && fromAddress && token) {
      const addressTokenBalances = tokenBalances.filter(
        tokenBalance =>
          tokenBalance.address === fromAddress &&
          tokenBalance.token.id === token.id
      );

      if (addressTokenBalances.length > 0) {
        // eslint-disable-next-line security/detect-possible-timing-attacks
        if (token === null) {
          setToken(addressTokenBalances[0].token);
        }
      }
    }
  }, [tokenBalances, fromAddress]);

  useEffect(() => {
    if (userAddresses) {
      if (userAddresses.length > 0) {
        setFromAddress(userAddresses[0].address);
        setToAddress(userAddresses[0].address);
      }
    }
  }, [userAddresses]);

  useEffect(() => {
    if (
      fromAddress &&
      toAddress &&
      token &&
      fromChainId &&
      toChainId &&
      amountInputText
    ) {
      const parsedAmount = parseUnits(amountInputText, token.decimals);

      if (parsedAmount === BigInt(0)) {
        return;
      }

      const buildBridgeSendRequestBody: BuildBridgeSendRequestBody = {
        token,
        amount: parsedAmount.toString(),
        fromChainId,
        toChainId,
        from: fromAddress,
        to: toAddress,
      };

      buildBridgeSend(buildBridgeSendRequestBody);
    }
  }, [fromAddress, toAddress, token, amountInputText, fromChainId, toChainId]);

  const onSendPress = async () => {
    if (!bridgeSend) {
      throw new Error('Bridge send not built');
    }

    if (!fromAddress) {
      throw new Error('From address not set');
    }

    if (!toAddress) {
      throw new Error('To address not set');
    }

    if (!fromChainId) {
      throw new Error('From chain ID not set');
    }

    if (!token) {
      throw new Error('Token not set');
    }

    if (tokenPriceUsd === undefined || tokenPriceUsd === null) {
      throw new Error('Token price not found');
    }

    const privateKey = await getPrivateKey(fromAddress);

    if (!privateKey) {
      throw new Error('Private key not found');
    }

    const privateKeyAccount = privateKeyToAccount(privateKey);

    const signedTxs: Hex[] = [];
    for (const step of bridgeSend.steps) {
      const singedTx = await signEIP1159Tx({
        tx: step.tx,
        account: privateKeyAccount,
      });

      signedTxs.push(singedTx);
    }
    const parsedAmount = parseUnits(amountInputText, token.decimals);

    const formattedAmount = formatTokenAmount({
      amount: parsedAmount,
      token: token,
      tokenPriceUsd: tokenPriceUsd,
    });

    const sendBridgeTxRequestBody: SendBridgeTxRequestBody = {
      signedTxs,
      chainId: fromChainId,
      transfer: {
        token,
        amount: formattedAmount,
        from: fromAddress,
        to: toAddress,
      },
    };

    await sendBridgeTx(sendBridgeTxRequestBody);

    setAmountInputText('');

    navigation.navigate('MoveComplete');
  };

  return (
    <View
      style={{
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundColor: colors.background,
        rowGap: 16,
      }}
    >
      <MoveFundsOutput
        toAddress={toAddress}
        token={token}
        outputAmount={bridgeSend ? bridgeSend.amountOut.formatted : null}
        chainId={toChainId}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="chevrons-up" size={24} color={colors.border} />
      </View>
      <MoveFundsInput
        fromAddress={fromAddress}
        token={token}
        chainId={fromChainId}
        amountInputText={amountInputText}
        setAmountInputText={setAmountInputText}
        onOpenSelectToken={() => {
          navigation.navigate('SelectToken');
        }}
      />
      <StyledButton
        title="Send"
        onPress={onSendPress}
        isLoading={isSendingBridgeTx || isBuildingBridgeSend}
      />
    </View>
  );
};

export default MoveFunds;
