import useSend from '@/hooks/useSend';
import { Text, View } from 'react-native';
import StyledTextInput from '@/components/StyledTextInput';
import StyledButton from '@/components/StyledButton';
import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import { FontAwesome5 } from '@expo/vector-icons';
import { getDefaultAutoSelectFamilyAttemptTimeout } from 'net';
import { getClipboardText } from '@/lib/utils';
import { theme } from '@/lib/theme';

const SendToNonSutoriUser = () => {
  const { mutateAsync: send, isPending: isSending } = useSend();
  const [recipientAddress, setRecipientAddress] = useState('0x94f149b27065aa60ef053788f6B8A60C53C001D4');
  const [amount, setAmount] = useState(2);

  const onSendPress = useCallback(() => {
    send({
      amount: parseUnits(amount.toString(), 6),
      to: recipientAddress,
    });
  }, [recipientAddress, send, amount]);

  const onPastePress = useCallback(async () => {
    const clipboardText = await getClipboardText();
    setRecipientAddress(clipboardText);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'column',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 8,
          }}
        >
          <StyledTextInput
            style={{
              width: 200,
            }}
            keyboardType="default"
            onChangeText={setRecipientAddress}
            value={recipientAddress}
            placeholder="recipient address"
          ></StyledTextInput>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: 8,
            }}
          >
            <Text
              style={{
                color: theme.blue,
              }}
              onPress={onPastePress}
            >
              Paste
            </Text>
            <FontAwesome5
              name="pen"
              size={12}
              color={theme.blue}
              onPress={onPastePress}
            />
          </View>
        </View>
        <StyledTextInput
          placeholder="Amount"
          value={amount.toString()}
          onChangeText={_amount => {
            setAmount(Number(_amount));
          }}
          style={{
            width: 120,
          }}
          keyboardType="numeric"
          postfix="USDC"
        ></StyledTextInput>
      </View>
      <StyledButton
        title="Send"
        onPress={onSendPress}
        isLoading={isSending}
      ></StyledButton>
    </View>
  );
};

export default SendToNonSutoriUser;
