import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import StyledText from '@/components/StyledText/StyledText';
import StyledButton from '@/components/StyledButton/StyledButton';
import { useTranslation } from 'react-i18next';
import { Alert, TextInput, View } from 'react-native';
import colors from '@/lib/styles/colors';
import { useState } from 'react';
import useStartWatch from '@/hooks/useStartWatch';
import { isAddress, Hex, getAddress } from 'viem';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import useEnsAddress from '@/hooks/useEnsAddress';
import SearchInputAccessory from '@/components/SearchInputAccessory/SearchInputAccessory';

const StartWatch = () => {
  const { t } = useTranslation('StartWatch');
  const [address, setAddress] = useState('');
  const { mutateAsync: startWatch } = useStartWatch();

  const navigation = useTypedNavigation();

  const { data: ensAddress } = useEnsAddress(address);

  const onStartPress = async () => {
    if (isAddress(address)) {
      await startWatch({ address: getAddress(address) as Hex });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs', params: { screen: 'Home' } }],
      });
    } else if (ensAddress) {
      await startWatch({ address: getAddress(ensAddress) as Hex });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs', params: { screen: 'Home' } }],
      });
    } else {
      Alert.alert('Invalid address');
    }
  };

  const canStart = isAddress(address) || ensAddress;
  const inputAccessoryViewID = 'startwatch.input';

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        paddingHorizontal: 16,
        rowGap: 16,
      }}
    >
      <View style={{ flexDirection: 'column', rowGap: 16 }}>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: 100,
          }}
        >
          <Feather name="eye" size={48} color={colors.border} />
        </View>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            height: 56,
            borderRadius: 16,
            paddingHorizontal: 12,
            width: '100%',
            color: colors.border,
          }}
          value={address}
          onChangeText={setAddress}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          placeholder="ENS or Ethereum address"
          inputAccessoryViewID={inputAccessoryViewID}
        />
        {ensAddress && (
          <StyledText style={{ color: colors.border }}>{ensAddress}</StyledText>
        )}
        <SearchInputAccessory
          onClear={() => setAddress('')}
          onPaste={async () => setAddress(await Clipboard.getStringAsync())}
          inputAccessoryViewID={inputAccessoryViewID}
        />
      </View>
      <StyledButton
        title={t('watchAddress')}
        onPress={onStartPress}
        disabled={!canStart}
      />
    </View>
  );
};

export default StartWatch;
