import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import { useSignIn } from '@/hooks/useSIgnIn';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { mnemonicToAccount } from 'viem/accounts';

/**
 * Sign in screen
 */
const SignIn = () => {
  const { t } = useTranslation('SignIn');
  const [mnemonic, setMnemonic] = useState('');
  const [isMnemonicValid, setIsMnemonicValid] = useState(false);
  const { mutateAsync: signIn, isPending: isSigningIn } = useSignIn();
  const navigation = useTypedNavigation();

  const onSignInPress = useCallback(async () => {
    await signIn({ mnemonic });
    navigation.navigate('Tabs', { screen: 'Home' });
  }, [signIn, mnemonic]);

  useEffect(() => {
    try {
      mnemonicToAccount(mnemonic);
      setIsMnemonicValid(true);
    } catch (_e) {
      setIsMnemonicValid(false);
    }
  }, [mnemonic]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        rowGap: 24,
        marginTop: 24,
      }}
    >
      <StyledTextInput
        autoCapitalize="none"
        multiline
        placeholder={t('enterYourMnemonic')}
        value={mnemonic}
        onChangeText={setMnemonic}
        inputStyle={{
          width: 280,
          height: 100,
        }}
      ></StyledTextInput>
      <StyledButton
        isLoading={isSigningIn}
        title={t('signIn')}
        onPress={onSignInPress}
        disabled={!isMnemonicValid}
      ></StyledButton>
    </View>
  );
};

export default SignIn;
