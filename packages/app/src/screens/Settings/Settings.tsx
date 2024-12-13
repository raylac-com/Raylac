import StyledButton from '@/components/StyledButton/StyledButton';
import { useSignOut } from '@/hooks/useSignOut';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { View } from 'react-native';

const Settings = () => {
  const navigation = useTypedNavigation();

  const { mutateAsync: signOut, isPending: isSigningOut } = useSignOut();

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
        justifyContent: 'flex-end',
        padding: 16,
      }}
    >
      <StyledButton
        title="Sign out"
        onPress={onSignOutPress}
        isLoading={isSigningOut}
      />
    </View>
  );
};

export default Settings;
