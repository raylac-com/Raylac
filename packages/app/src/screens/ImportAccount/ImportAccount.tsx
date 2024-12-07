import StyledButton from '@/components/StyledButton/StyledButton';
import useImportAccount from '@/hooks/useImportAccount';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as bip39 from 'bip39';
import Toast from 'react-native-toast-message';
import MultiLineInput from '@/components/MultiLineInput';

/**
 * Sign in screen
 */
const ImportAccount = () => {
  const [mnemonic, setMnemonic] = useState('');
  const [isMnemonicValid, setIsMnemonicValid] = useState(false);
  const {
    mutateAsync: signIn,
    isPending: isSigningIn,
    error: signInError,
  } = useImportAccount();

  const navigation = useTypedNavigation();

  const onSignInPress = useCallback(async () => {
    await signIn({ mnemonic });
    navigation.navigate('Tabs', { screen: 'Home' });
  }, [signIn, mnemonic]);

  useEffect(() => {
    if (signInError) {
      Toast.show({
        text1: 'Error',
        text2: signInError.message,
        type: 'error',
      });
    }
  }, [signInError]);

  useEffect(() => {
    try {
      const _mnemonicValid = bip39.validateMnemonic(mnemonic);
      setIsMnemonicValid(_mnemonicValid);
    } catch (_e) {
      setIsMnemonicValid(false);
    }
  }, [mnemonic]);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        rowGap: 16,
        padding: 16,
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <MultiLineInput
          editable
          autoFocus
          autoCapitalize="none"
          multiline
          placeholder={'Enter your mnemonic'}
          value={mnemonic}
          onChangeText={setMnemonic}
        ></MultiLineInput>
      </View>
      <StyledButton
        isLoading={isSigningIn}
        title={'Import account'}
        onPress={onSignInPress}
        disabled={!isMnemonicValid}
      ></StyledButton>
    </View>
  );
};

export default ImportAccount;
