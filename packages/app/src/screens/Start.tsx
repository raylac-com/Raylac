import StyledButton from '@/components/StyledButton';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { View } from 'react-native';

const Start = () => {
  const navigation = useTypedNavigation();
  const { data: isSignedIn} = useIsSignedIn();

  if (isSignedIn) {
    navigation.navigate("Tabs", {
      screen: "Home"
    });
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        rowGap: 24,
      }}
    >
      <StyledButton
        title="Sign In"
        onPress={() => {
          navigation.navigate('SignIn');
        }}
        style={{
          justifyContent: 'center',
          width: 160
        }}
      ></StyledButton>
      <StyledButton
        title="Create account"
        onPress={() => {
          navigation.navigate('SignUp');
        }}
        style={{
          justifyContent: 'center',
          width: 160
        }}
      ></StyledButton>
    </View>
  );
};

export default Start;
