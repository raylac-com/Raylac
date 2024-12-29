import StyledText from '@/components/StyledText/StyledText';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { Pressable, View } from 'react-native';

const Settings = () => {
  const navigation = useTypedNavigation();

  const onAddressesPress = () => {
    navigation.navigate('Addresses');
  };

  const onAdvancedPress = () => {
    navigation.navigate('Advanced');
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'column', gap: 16 }}>
        <Pressable onPress={onAddressesPress}>
          <StyledText>{`Addresses`}</StyledText>
        </Pressable>
        <Pressable onPress={onAdvancedPress}>
          <StyledText>{`Advanced`}</StyledText>
        </Pressable>
      </View>
    </View>
  );
};

export default Settings;
