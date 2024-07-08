import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import { initAccountFromMnemonic } from '@/lib/account';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { mnemonicToAccount } from 'viem/accounts';

const SignIn = () => {
  const [mnemonic, setMnemonic] = useState('');
  const [isMnemonicValid, setIsMnemonicValid] = useState(false);

  const onSignInPress = useCallback(async () => {
    await initAccountFromMnemonic(mnemonic);
  }, [mnemonic]);

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
        placeholder="Enter your mnemonic"
        value={mnemonic}
        onChangeText={setMnemonic}
        inputStyle={{
          width: 280,
          height: 100,
        }}
      ></StyledTextInput>
      <StyledButton
        title="Sign In"
        onPress={onSignInPress}
        disabled={!isMnemonicValid}
      ></StyledButton>
    </View>
  );
};

export default SignIn;
