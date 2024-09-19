import StyledButton from '@/components/StyledButton';
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

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>;

const ConfirmSend = ({ route }: Props) => {
  const { amount, recipientUserOrAddress, tokenId, outputChainId } =
    route.params;
  const { mutateAsync: send, isPending: isSending } = useSend();
  const navigation = useTypedNavigation();
  const { t } = useTranslation('ConfirmSend');

  const onSendPress = useCallback(async () => {
    await send({
      amount: BigInt(amount),
      tokenId,
      outputChainId,
      recipientUserOrAddress,
    });

    // Navigate to the `SendSuccess` screen
    navigation.navigate('SendSuccess');
  }, [recipientUserOrAddress, send, amount]);

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
        justifyContent: 'center',
        padding: 24,
        marginTop: -60,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          rowGap: 12,
        }}
      >
        <Text
          style={{
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
        title={t('send')}
        isLoading={isSending}
        onPress={() => {
          onSendPress();
        }}
        style={{
          marginTop: 24,
        }}
      ></StyledButton>
    </View>
  );
};

export default ConfirmSend;
