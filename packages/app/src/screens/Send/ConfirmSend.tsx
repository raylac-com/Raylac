import StyledButton from '@/components/StyledButton';
import useSend from '@/hooks/useSend';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { generateStealthAddress } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Hex, parseUnits } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>;

const ConfirmSend = ({ route }: Props) => {
  const {
    amount,
    recipientUserOrAddress,
    inputTokenId,
    outputTokenId,
    outputChainId,
  } = route.params;
  const { mutateAsync: send, isPending: isSending } = useSend();
  const navigation = useTypedNavigation();
  const { t } = useTranslation('ConfirmSend');

  const onSendPress = useCallback(async () => {
    await send({
      amount: BigInt(amount),
      inputTokenId,
      outputTokenId,
      recipientUserOrAddress,
    });

    // Navigate to the `SendSuccess` screen
    navigation.navigate('SendSuccess');
  }, [recipientUserOrAddress, send, amount]);

  const recipientName =
    typeof recipientUserOrAddress === 'string'
      ? shortenAddress(recipientUserOrAddress)
      : recipientUserOrAddress.name;

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
          {t('sendToUser', { name: recipientName })}
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.text,
          }}
        >
          {amount.toLocaleString()} USDC
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
