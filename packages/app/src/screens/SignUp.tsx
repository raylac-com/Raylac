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
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

interface UsernameAvailabilityIndicator {
  username: string;
  isUsernameAvailable: boolean;
  isPending: boolean;
}

const UsernameAvailabilityIndicator = (
  props: UsernameAvailabilityIndicator
) => {
  const { t } = useTranslation('SignUp');
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
        {t('usernameLengthWarning', { minChars: MIN_USERNAME_LENGTH })}
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
        {t('usernameInvalid')}
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
        {t('usernameTaken')}
      </Text>
    );
  }

  return null;
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SignUp'>;

/**
 * Sign up screen
 */
const SignUp = ({ route }: Props) => {
  const { t } = useTranslation('SignUp');
  const { inviteCode } = route.params;
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const { mutateAsync: signUp, isPending: isSigningUp } = useSignUp();

  const { data: isSignedIn } = useIsSignedIn();

  const { debouncedValue: debouncedUsername, isPending } = useDebounce(
    username,
    500
  );

  const { data: isUsernameAvailable, isPending: isCheckingUsername } =
    trpc.isUsernameAvailable.useQuery({
      username: debouncedUsername,
    });

  const canGoNext =
    isValidUsername(username) && isUsernameAvailable && !isCheckingUsername;

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
        marginTop: 24,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          rowGap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: theme.text,
          }}
        >{t('name')}
        </Text>
        <StyledTextInput
          value={name}
          placeholder={t('name')}
          style={{
            marginTop: 40,
          }}
          inputStyle={{
            width: 220,
          }}
          onChangeText={text => {
            setName(text);
          }}
        ></StyledTextInput>
      </View>
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          rowGap: 8,
          marginTop: 8,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: theme.text,
          }}
        >
          {t('username')}
        </Text>
        <StyledTextInput
          placeholder={t('username')}
          inputStyle={{
            width: 220,
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
      </View>
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
            inviteCode,
            username,
          });

          navigation.navigate('Tabs', {
            screen: 'Home',
          });
        }}
        title={t('signUp')}
      ></StyledButton>
    </View>
  );
};

export default SignUp;
