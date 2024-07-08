import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import useDebounce from '@/hooks/useDebounce';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import useSignUp from '@/hooks/useSignUp';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import {
  MIN_USERNAME_LENGTH,
  USERNAME_REGEX,
  isValidUsername,
} from '@/lib/username';
import { RootStackParamsList } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface UsernameAvailabilityIndicator {
  username: string;
  isUsernameAvailable: boolean;
  isPending: boolean;
}

const UsernameAvailabilityIndicator = (
  props: UsernameAvailabilityIndicator
) => {
  const { username, isUsernameAvailable, isPending } = props;

  if (!username || isPending) {
    return null;
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return (
      <Text
        style={{
          color: theme.waning,
        }}
      >
        Username must be at least {MIN_USERNAME_LENGTH} characters
      </Text>
    );
  }

  if (USERNAME_REGEX.test(username) === false) {
    return (
      <Text
        style={{
          color: theme.waning,
        }}
      >
        Username contains invalid characters
      </Text>
    );
  }

  if (isUsernameAvailable === false) {
    return (
      <Text
        style={{
          color: theme.waning,
        }}
      >
        Username is not available
      </Text>
    );
  }

  return null;
};

const SignUp = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const { mutateAsync: signUp, isPending: isSigningUp } = useSignUp();

  const { data: isSignedIn } = useIsSignedIn();

  const { debouncedValue: debouncedUsername, isPending } = useDebounce(
    username,
    500
  );

  const { data: isUsernameAvailable } = trpc.isUsernameAvailable.useQuery({
    username: debouncedUsername,
  });

  const canGoNext = isValidUsername(username);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamsList>>();

  useEffect(() => {
    if (isSignedIn === true) {
      navigation.navigate('Tabs', {
        screen: 'Home',
      });
    }
  }, [isSignedIn]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        rowGap: 8,
        marginTop: 24
      }}
    >
      <StyledTextInput
        value={name}
        placeholder="Name"
        style={{
          width: 240,
          marginTop: 40,
        }}
        onChangeText={text => {
          setName(text);
        }}
      ></StyledTextInput>
      <StyledTextInput
        placeholder="Username"
        style={{
          width: 240,
        }}
        value={username}
        inputMode="text"
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
        onChangeText={text => {
          setUsername(text.toLowerCase());
        }}
      ></StyledTextInput>
      <UsernameAvailabilityIndicator
        isPending={isPending}
        isUsernameAvailable={isUsernameAvailable}
        username={username}
      ></UsernameAvailabilityIndicator>
      <StyledButton
        style={{
          marginTop: 20,
        }}
        disabled={!canGoNext}
        isLoading={isSigningUp}
        onPress={async () => {
          await signUp({
            name,
            username,
          });

          navigation.navigate('Tabs', {
            screen: 'Home',
          });
        }}
        title="Sign Up"
      ></StyledButton>
    </View>
  );
};

export default SignUp;
