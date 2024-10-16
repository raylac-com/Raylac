import FastAvatar from '@/components/FastAvatar';
import StyledButton from '@/components/StyledButton';
import useGasInfo from '@/hooks/useGasInfo';
import useSend from '@/hooks/useSend';
import useTokenPrice from '@/hooks/useTokenPrice';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import mixpanel from '@/lib/mixpanle';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import {
  AddressTokenBalance,
  formatAmount,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import supportedChains from '@raylac/shared/out/supportedChains';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { formatUnits, Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>;

const ConfirmSend = ({ route }: Props) => {
  const { amount, recipientUserOrAddress, tokenId, outputChainId } =
    route.params;
  const { mutateAsync: send, isPending: isSending } = useSend();
  const navigation = useTypedNavigation();
  const [usdAmount, setUsdAmount] = useState<string | null>(null);
  const { data: tokenPrice } = useTokenPrice(tokenId);

  const { data: stealthAddresses } = trpc.getStealthAccounts.useQuery();
  const { data: addressBalancesPerChain } =
    trpc.getAddressBalancesPerChain.useQuery();

  const { data: addressNonces } = trpc.getAddressNonces.useQuery();

  const { data: gasInfo } = useGasInfo();

  const onSendPress = useCallback(async () => {
    const start = Date.now();

    await send({
      amount: BigInt(amount),
      tokenId,
      chainId: outputChainId,
      recipientUserOrAddress,
      gasInfo,
      stealthAddresses: stealthAddresses as StealthAddressWithEphemeral[],
      addressBalancesPerChain: addressBalancesPerChain as AddressTokenBalance[],
      addressNonces: addressNonces as Record<Hex, number | null>,
      tokenPrice,
    });

    mixpanel.track('Send', {
      duration: Date.now() - start,
    });

    // Navigate to the `SendSuccess` screen
    navigation.navigate('SendSuccess');
  }, [
    recipientUserOrAddress,
    send,
    amount,
    gasInfo,
    stealthAddresses,
    addressBalancesPerChain,
    tokenPrice,
  ]);

  const tokenMeta = supportedTokens.find(token => token.tokenId === tokenId);

  if (!tokenMeta) {
    throw new Error(`Token metadata not found for token ID: ${tokenId}`);
  }

  const formattedAmount = formatAmount(amount, tokenMeta.decimals);

  useEffect(() => {
    if (tokenPrice) {
      const formattedAmount = formatUnits(BigInt(amount), tokenMeta.decimals);
      const _usdAmount = tokenPrice * Number(formattedAmount);

      setUsdAmount(_usdAmount.toFixed(2));
    }
  }, [tokenPrice]);

  const recipientName =
    typeof recipientUserOrAddress === 'string'
      ? shortenAddress(recipientUserOrAddress)
      : recipientUserOrAddress.name;

  const destinationChainMetadata = supportedChains.find(
    chain => chain.id === outputChainId
  );

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <View
        style={{
          flex: 0.62,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: 16,
        }}
      >
        <FastAvatar
          address={
            typeof recipientUserOrAddress === 'string'
              ? recipientUserOrAddress
              : publicKeyToAddress(recipientUserOrAddress.spendingPubKey as Hex)
          }
          imageUrl={
            typeof recipientUserOrAddress === 'string'
              ? undefined
              : recipientUserOrAddress.profileImage
          }
          size={80}
        ></FastAvatar>
        <Text
          style={{
            fontSize: 20,
            textAlign: 'center',
            color: theme.text,
          }}
        >
          Send to {recipientName}
        </Text>
        <Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.text,
          }}
        >
          {formattedAmount.toLocaleString()} {tokenMeta.symbol}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 20,
            opacity: 0.6,
          }}
        >
          ~${usdAmount}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 16,
          }}
        >
          {recipientName} receives {formattedAmount.toLocaleString()}{' '}
          {tokenMeta.symbol} on {destinationChainMetadata.name}
        </Text>
      </View>
      <StyledButton
        title={'Send'}
        isLoading={isSending}
        onPress={() => {
          onSendPress();
        }}
        style={{
          width: '100%',
        }}
        disabled={gasInfo ? false : true}
      ></StyledButton>
    </View>
  );
};

export default ConfirmSend;
