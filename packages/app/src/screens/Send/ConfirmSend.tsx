import StyledButton from '@/components/StyledButton';
import useGenerateStealthAccount from '@/hooks/useGenerateStealthAccount';
import useSend from '@/hooks/useSend';
import { theme } from '@/lib/theme';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { Hex, parseUnits } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmSend'>;

const ConfirmSend = ({ route }: Props) => {
  const { amount, recipientUserOrAddress } = route.params;
  const { mutateAsync: send, isPending: isSending } = useSend();
  const { mutateAsync: generateStealthAccount } = useGenerateStealthAccount();

  const onSendPress = useCallback(async () => {
    const parsedAmount = parseUnits(amount.toString(), 6);
    if (typeof recipientUserOrAddress === 'string') {
      // If the recipient is an address, send directly to that address
      send({
        amount: parsedAmount,
        to: recipientUserOrAddress,
      });
    } else {
      // If the recipient is a Sutori user,
      // generate a stealth account and send to that
      const stealthAccount = await generateStealthAccount({
        viewingPubKey: recipientUserOrAddress.viewingPubKey as Hex,
        spendingPubKey: recipientUserOrAddress.spendingPubKey as Hex,
      });

      send({
        amount: parsedAmount,
        to: stealthAccount.address,
        stealthAccount,
      });
    }
  }, [recipientUserOrAddress, send, amount]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          color: theme.text,
        }}
      >
        Send {amount} USDC to{' '}
        {typeof recipientUserOrAddress === 'string'
          ? shortenAddress(recipientUserOrAddress)
          : recipientUserOrAddress.name}
      </Text>
      <StyledButton
        title="Send"
        isLoading={isSending}
        onPress={() => {
          onSendPress();
        }}
      ></StyledButton>
    </View>
  );
};

export default ConfirmSend;
