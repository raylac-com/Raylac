import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import MultiLineInput from '@/components/MultiLineInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useImportPrivKey from '@/hooks/useImportPrivKey';
import { Hex, isHex } from 'viem';
import * as bip39 from 'bip39';
import useImportMnemonic from '@/hooks/useImportMnemonic';

/**
 * Sign in screen
 */
const ImportAccount = () => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [isInputPrivKey, setIsInputPrivKey] = useState(false);
  const [isInputMnemonic, setIsInputMnemonic] = useState(false);

  const {
    mutateAsync: importPrivKey,
    isPending: isImportingPrivKey,
    error: importPrivKeyError,
  } = useImportPrivKey();

  const {
    mutateAsync: importMnemonic,
    isPending: isImportingMnemonic,
    error: importMnemonicError,
  } = useImportMnemonic();

  const navigation = useTypedNavigation();

  const onImportPress = useCallback(async () => {
    if (isInputPrivKey) {
      // Sanity check
      if (!isHex(inputText)) {
        throw new Error('Invalid private key');
      }

      await importPrivKey({ privKey: inputText as Hex });
      navigation.navigate('Tabs', { screen: 'Home' });
      return;
    }

    if (isInputMnemonic) {
      // Sanity check
      if (!bip39.validateMnemonic(inputText)) {
        throw new Error('Invalid mnemonic');
      }

      await importMnemonic({ mnemonic: inputText });
      navigation.navigate('Tabs', { screen: 'Home' });
      return;
    }

    throw new Error('Invalid input');
  }, [
    importPrivKey,
    importMnemonic,
    navigation,
    inputText,
    isInputPrivKey,
    isInputMnemonic,
  ]);

  useEffect(() => {
    if (importPrivKeyError) {
      Toast.show({
        text1: 'Error',
        text2: importPrivKeyError.message,
        type: 'error',
      });
    }

    if (importMnemonicError) {
      Toast.show({
        text1: 'Error',
        text2: importMnemonicError.message,
        type: 'error',
      });
    }
  }, [importPrivKeyError, importMnemonicError]);

  useEffect(() => {
    if (inputText) {
      const _isInputPrivKey = isHex(inputText);

      setIsInputPrivKey(_isInputPrivKey);

      const _isInputMnemonic = bip39.validateMnemonic(inputText);
      setIsInputMnemonic(_isInputMnemonic);
    }
  }, [inputText]);

  useEffect(() => {
    return () => {
      setInputText('');
      setIsInputPrivKey(false);
      setIsInputMnemonic(false);
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        rowGap: 16,
        padding: 16,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <MultiLineInput
        editable
        autoFocus
        autoCapitalize="none"
        multiline
        placeholder={'Enter mnemonic or private key'}
        value={inputText}
        onChangeText={setInputText}
      ></MultiLineInput>
      <StyledButton
        isLoading={isImportingPrivKey || isImportingMnemonic}
        title={`Import ${isInputPrivKey ? 'private key' : isInputMnemonic ? 'mnemonic' : 'account'}`}
        onPress={onImportPress}
        disabled={!isInputPrivKey && !isInputMnemonic}
      ></StyledButton>
    </View>
  );
};

export default ImportAccount;
