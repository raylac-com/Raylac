import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import MultiLineInput from '@/components/MultiLineInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useImportPrivKey from '@/hooks/useImportPrivKey';
import { isHex } from 'viem';

/**
 * Sign in screen
 */
const ImportAccount = () => {
  const insets = useSafeAreaInsets();
  const [privKey, setPrivKey] = useState('');
  const [isPrivKeyValid, setIsPrivKeyValid] = useState(false);

  const {
    mutateAsync: importPrivKey,
    isPending: isImportingPrivKey,
    error: importPrivKeyError,
  } = useImportPrivKey();

  const navigation = useTypedNavigation();

  const onImportPrivKeyPress = useCallback(async () => {
    if (isHex(privKey)) {
      await importPrivKey({ privKey });
      navigation.navigate('Tabs', { screen: 'Home' });
    }
  }, [importPrivKey, privKey]);

  useEffect(() => {
    if (importPrivKeyError) {
      Toast.show({
        text1: 'Error',
        text2: importPrivKeyError.message,
        type: 'error',
      });
    }
  }, [importPrivKeyError]);

  useEffect(() => {
    if (privKey) {
      const _isPrivKeyValid = isHex(privKey);
      setIsPrivKeyValid(_isPrivKeyValid);
    }
  }, [privKey]);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        rowGap: 16,
        padding: 16,
        paddingBottom: insets.bottom,
      }}
    >
      <MultiLineInput
        editable
        autoFocus
        autoCapitalize="none"
        multiline
        placeholder={'Enter your private key'}
        value={privKey}
        onChangeText={setPrivKey}
      ></MultiLineInput>
      <StyledButton
        isLoading={isImportingPrivKey}
        title={'Import account'}
        onPress={onImportPrivKeyPress}
        disabled={!isPrivKeyValid}
      ></StyledButton>
    </View>
  );
};

export default ImportAccount;
