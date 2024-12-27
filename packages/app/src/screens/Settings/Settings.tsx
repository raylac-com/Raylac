import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import { useSignOut } from '@/hooks/useSignOut';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { Pressable, View } from 'react-native';

const Settings = () => {
  const navigation = useTypedNavigation();

  const { mutateAsync: signOut, isPending: isSigningOut } = useSignOut();

  const onAddAddressPress = () => {
    navigation.navigate('AddAddress');
  };

  const onAdvancedPress = () => {
    navigation.navigate('Advanced');
  };

  const onSignOutPress = async () => {
    await signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Start' }],
    });
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
        <Pressable onPress={onAddAddressPress}>
          <StyledText>{`Add address`}</StyledText>
        </Pressable>
        <Pressable onPress={onAdvancedPress}>
          <StyledText>{`Advanced`}</StyledText>
        </Pressable>
      </View>
      <StyledButton
        title="Sign out"
        onPress={onSignOutPress}
        isLoading={isSigningOut}
      />
    </View>
  );
};

export default Settings;
