import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { View } from 'react-native';

const Start = () => {
  const navigation = useTypedNavigation();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <StyledButton
        title="Sign In"
        onPress={() => {
          navigation.navigate("SignIn");
        }}
      ></StyledButton>
      <StyledButton
        title="Create account"
        onPress={() => {
          navigation.navigate('SignUp');
        }}
      ></StyledButton>
    </View>
  );
};

export default Start;
