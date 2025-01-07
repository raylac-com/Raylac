import StyledText from '@/components/StyledText/StyledText';
import StyledButton from '@/components/StyledButton/StyledButton';
import { Alert, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/lib/styles/colors';
import { useState } from 'react';
import useStartWatch from '@/hooks/useStartWatch';
import { isAddress, Hex, getAddress } from 'viem';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import useEnsAddress from '@/hooks/useEnsAddress';

const StartWatch = () => {
  const insets = useSafeAreaInsets();
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

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        padding: 16,
        paddingBottom: insets.bottom,
        rowGap: 16,
      }}
    >
      <View style={{ flexDirection: 'column', rowGap: 16 }}>
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
          placeholder="Your Ethereum address"
        />
        <StyledText style={{ color: colors.border }}>
          {ensAddress ? `${ensAddress}` : ''}
        </StyledText>
      </View>
      <StyledButton
        title="Watch address"
        onPress={onStartPress}
        disabled={!canStart}
      />
    </View>
  );
};

export default StartWatch;
