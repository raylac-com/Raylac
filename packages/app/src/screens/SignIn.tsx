import StyledButton from '@/components/StyledButton';
import { useSignIn } from '@/hooks/useSIgnIn';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as bip39 from 'bip39';
import Toast from 'react-native-toast-message';
import spacing from '@/lib/styles/spacing';
import MultiLineInput from '@/components/MultiLineInput';

/**
 * Sign in screen
 */
const SignIn = () => {
  const { t } = useTranslation('SignIn');
  const [mnemonic, setMnemonic] = useState('');
  const [isMnemonicValid, setIsMnemonicValid] = useState(false);
  const {
    mutateAsync: signIn,
    isPending: isSigningIn,
    error: signInError,
  } = useSignIn();
  const navigation = useTypedNavigation();

  const onSignInPress = useCallback(async () => {
    // await sleep(100);
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
        alignItems: 'center',
        rowGap: spacing.small,
        padding: spacing.small,
      }}
    >
      <MultiLineInput
        editable
        autoFocus
        autoCapitalize="none"
        multiline
        placeholder={t('enterYourMnemonic')}
        value={mnemonic}
        onChangeText={setMnemonic}
      ></MultiLineInput>
      <StyledButton
        isLoading={isSigningIn}
        title={t('signIn')}
        onPress={onSignInPress}
        disabled={!isMnemonicValid}
        variant="primary"
      ></StyledButton>
    </View>
  );
};

export default SignIn;
