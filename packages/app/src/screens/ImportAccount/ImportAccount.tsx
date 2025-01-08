import * as Clipboard from 'expo-clipboard';
import Feather from '@expo/vector-icons/Feather';
import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback, useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useImportPrivKey from '@/hooks/useImportPrivKey';
import { Hex, isHex } from 'viem';
import * as bip39 from 'bip39';
import useImportMnemonic from '@/hooks/useImportMnemonic';
import { setBackupVerified } from '@/lib/key';
import colors from '@/lib/styles/colors';
import SearchInputAccessory from '@/components/SearchInputAccessory/SearchInputAccessory';

/**
 * Sign in screen
 */
const ImportAccount = () => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [isInputPrivKey, setIsInputPrivKey] = useState(false);
  const [isInputMnemonic, setIsInputMnemonic] = useState(false);

  const clearState = () => {
    setInputText('');
    setIsInputPrivKey(false);
    setIsInputMnemonic(false);
  };

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
        clearState();
        throw new Error('Invalid private key');
      }

      await importPrivKey({ privKey: inputText as Hex });
      clearState();

      navigation.navigate('Tabs', { screen: 'Home' });
    } else if (isInputMnemonic) {
      // Sanity check
      if (!bip39.validateMnemonic(inputText)) {
        clearState();
        throw new Error('Invalid mnemonic');
      }

      const address = await importMnemonic({ mnemonic: inputText });
      await setBackupVerified(address);
      clearState();

      navigation.navigate('Tabs', { screen: 'Home' });
    } else {
      clearState();
      throw new Error('Invalid input');
    }
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

  const inputAccessoryViewID = 'import-account-input-accessory';

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        rowGap: 16,
        padding: 16,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: 100,
        }}
      >
        <Feather name="key" size={48} color={colors.border} />
      </View>
      <TextInput
        style={{
          height: 160,
          color: colors.text,
          width: '100%',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 16,
        }}
        placeholder={'Enter mnemonic or private key'}
        placeholderTextColor={colors.border}
        multiline={true}
        editable
        autoFocus
        autoCapitalize="none"
        value={inputText}
        onChangeText={setInputText}
        inputAccessoryViewID={inputAccessoryViewID}
      />
      <SearchInputAccessory
        onClear={() => setInputText('')}
        onPaste={async () => setInputText(await Clipboard.getStringAsync())}
        inputAccessoryViewID={inputAccessoryViewID}
      />
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
