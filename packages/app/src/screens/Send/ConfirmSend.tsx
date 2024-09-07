 import StyledButton from '@/components/StyledButton';
import useGenerateStealthAccount from '@/hooks/useGenerateStealthAccount';
import useSend from '@/hooks/useSend';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Hex, parseUnits } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>;

const ConfirmSend = ({ route }: Props) => {
  const { amount, recipientUserOrAddress } = route.params;
  const { mutateAsync: send, isPending: isSending } = useSend();
  const { mutateAsync: generateStealthAccount } = useGenerateStealthAccount();
  const navigation = useTypedNavigation();
  const { t } = useTranslation('ConfirmSend');

  const onSendPress = useCallback(async () => {
    const parsedAmount = parseUnits(amount.toString(), 6);
    if (typeof recipientUserOrAddress === 'string') {
      // If the recipient is an address, send directly to that address
      await send({
        amount: parsedAmount,
        to: recipientUserOrAddress,
      });
    } else {
      // If the recipient is a Raylac user,
      // generate a stealth account and send to that
      const stealthAccount = await generateStealthAccount({
        viewingPubKey: recipientUserOrAddress.viewingPubKey as Hex,
        spendingPubKey: recipientUserOrAddress.spendingPubKey as Hex,
      });

      await send({
        amount: parsedAmount,
        to: stealthAccount.address,
        stealthAccount,
      });
    }

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
      <View style={{
        flexDirection: 'column',
        rowGap: 12,
      }}>
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
          {amount} USDC
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
