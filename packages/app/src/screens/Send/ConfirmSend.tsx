import FastAvatar from '@/components/FastAvatar';
import StyledButton from '@/components/StyledButton';
import useGasInfo from '@/hooks/useGasInfo';
import useSend from '@/hooks/useSend';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { formatAmount } from '@raylac/shared';
import supportedChains from '@raylac/shared/out/supportedChains';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>;

const ConfirmSend = ({ route }: Props) => {
  const { amount, recipientUserOrAddress, tokenId, outputChainId } =
    route.params;
  const { mutateAsync: send, isPending: isSending } = useSend();
  const navigation = useTypedNavigation();

  const { data: gasInfo } = useGasInfo();

  const { t } = useTranslation('ConfirmSend');

  const onSendPress = useCallback(async () => {
    await send({
      amount: BigInt(amount),
      tokenId,
      outputChainId,
      recipientUserOrAddress,
      gasInfo,
    });

    // Navigate to the `SendSuccess` screen
    navigation.navigate('SendSuccess');
  }, [recipientUserOrAddress, send, amount, gasInfo]);

  const tokenMeta = supportedTokens.find(token => token.tokenId === tokenId);

  if (!tokenMeta) {
    throw new Error(`Token metadata not found for token ID: ${tokenId}`);
  }

  const formattedAmount = formatAmount(amount, tokenMeta.decimals);

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
        alignItems: 'center',
        padding: 24,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          rowGap: 12,
          marginTop: 48,
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
          size={64}
        ></FastAvatar>
        <Text
          style={{
            marginTop: 24,
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.text,
          }}
        >
          {t('sendToUser', {
            name: recipientName,
            amount: formattedAmount,
            symbol: tokenMeta.symbol,
          })}
        </Text>

        <Text
          style={{
            color: theme.text,
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
          marginTop: 48,
        }}
        disabled={gasInfo ? false : true}
      ></StyledButton>
      {/**
         * 
     
      <View
        style={{
          flexDirection: 'column',
          alignItems: "center",
          marginTop: 24,
          rowGap: 18,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 12,
          }}
        >
          <AntDesign name="checkcircle" size={24} color={theme.primary} />
          <Text
            style={{
              color: theme.text,
              fontWeight: 'bold',
              fontSize: 20,
            }}
          >
            Sent
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: "flex-start",
            columnGap: 12,
          }}
        >
          <LoadingIndicator size={24}></LoadingIndicator>
          <Text
            style={{
              color: theme.text,
              fontWeight: 'bold',
              fontSize: 20,
            }}
          >
            Confirming
          </Text>
        </View>
      </View>
       */}
    </View>
  );
};

export default ConfirmSend;
