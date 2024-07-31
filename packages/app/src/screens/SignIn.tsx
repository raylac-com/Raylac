import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import { useSignIn } from '@/hooks/useSIgnIn';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { mnemonicToAccount } from 'viem/accounts';

const SignIn = () => {
  const { t} = useTranslation('Start');
  const [mnemonic, setMnemonic] = useState('');
  const [isMnemonicValid, setIsMnemonicValid] = useState(false);
  const { mutateAsync: signIn, isPending: isSigningIn } = useSignIn();

  const onSignInPress = useCallback(async () => {
    await signIn({ mnemonic });
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
