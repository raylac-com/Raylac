import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { View } from 'react-native';

const Settings = () => {
  const navigation = useTypedNavigation();

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
        onPress={() => navigation.navigate('Start')}
      ></StyledButton>
    </View>
  );
};

export default Settings;
