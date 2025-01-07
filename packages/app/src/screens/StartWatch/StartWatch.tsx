import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import StyledText from '@/components/StyledText/StyledText';
import StyledButton from '@/components/StyledButton/StyledButton';
import { Alert, InputAccessoryView, TextInput, View } from 'react-native';
import colors from '@/lib/styles/colors';
import { useState } from 'react';
import useStartWatch from '@/hooks/useStartWatch';
import { isAddress, Hex, getAddress } from 'viem';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import useEnsAddress from '@/hooks/useEnsAddress';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';

const InputAccessoryButton = ({
  onPress,
  label,
  icon,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
}) => {
  return (
    <FeedbackPressable
      style={{
        backgroundColor: colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 6,
        width: 90,
        columnGap: 4,
        shadowColor: colors.border,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.7,
        shadowRadius: 4,
      }}
      onPress={onPress}
    >
      {icon}
      <StyledText style={{ color: colors.border }}>{label}</StyledText>
    </FeedbackPressable>
  );
};

const SearchInputAccessory = ({
  onClear,
  onPaste,
}: {
  onClear: () => void;
  onPaste: () => void;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        columnGap: 32,
        marginBottom: 24,
      }}
    >
      <InputAccessoryButton
        onPress={onClear}
        label="Clear"
        icon={<Feather name="x" size={20} color={colors.border} />}
      />
      <InputAccessoryButton
        onPress={onPaste}
        label="Paste"
        icon={<Feather name="clipboard" size={20} color={colors.border} />}
      />
    </View>
  );
};

const StartWatch = () => {
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
          <Feather name="eye" size={64} color={colors.border} />
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
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <SearchInputAccessory
            onClear={() => setAddress('')}
            onPaste={async () => setAddress(await Clipboard.getStringAsync())}
          />
        </InputAccessoryView>
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
