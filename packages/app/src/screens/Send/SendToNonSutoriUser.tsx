import { Text, View } from 'react-native';
import StyledTextInput from '@/components/StyledTextInput';
import StyledButton from '@/components/StyledButton';
import { useCallback, useState } from 'react';
import { Hex, isAddress } from 'viem';
import { FontAwesome5 } from '@expo/vector-icons';
import { getClipboardText } from '@/lib/utils';
import { theme } from '@/lib/theme';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useTranslation } from 'react-i18next';

const SendToNonSutoriUser = () => {
  const navigation = useTypedNavigation();
  const [recipientAddress, setRecipientAddress] = useState('');
  const { t } = useTranslation();

  const onNextClick = useCallback(() => {
    navigation.navigate('EnterSendAmount', {
      recipientUserOrAddress: recipientAddress as Hex,
    });
  }, [recipientAddress, navigation]);

  const onPastePress = useCallback(async () => {
    const clipboardText = await getClipboardText();
    if (clipboardText) {
      setRecipientAddress(clipboardText);
    }
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 8,
          marginTop: 20,
        }}
      >
        <StyledTextInput
          autoFocus
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
      {recipientAddress &&
      !isAddress(recipientAddress, {
        strict: false,
      }) ? (
        <Text
          style={{
            color: theme.waning,
            marginTop: 8,
          }}
        >
          Invalid address
        </Text>
      ) : null}
      <StyledButton
        style={{
          marginTop: 24,
        }}
        title={t('next', { ns: 'common' })}
        onPress={onNextClick}
      ></StyledButton>
    </View>
  );
};

export default SendToNonSutoriUser;
