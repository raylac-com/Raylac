import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import useSignUp from '@/hooks/useSignUp';
import { theme } from '@/lib/theme';
import { isValidUsername } from '@/lib/username';
import { RootStackParamsList } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import useCheckUsername from '@/hooks/useCheckUsername';
import UsernameAvailabilityIndicator from '@/components/UsernameAvailabilityIndicator';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Props = NativeStackScreenProps<RootStackParamsList, 'SignUp'>;

/**
 * Sign up screen
 */
const SignUp = () => {
  const { t } = useTranslation('SignUp');
  //  const { inviteCode } = route.params;
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const { mutateAsync: signUp, isPending: isSigningUp } = useSignUp();

  const { isUsernameAvailable, isCheckingUsername } =
    useCheckUsername(username);

  const canGoNext =
    isValidUsername(username) && isUsernameAvailable && !isCheckingUsername;

  const { data: isSignedIn } = useIsSignedIn();

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
            fontWeight: 'bold',
            color: theme.text,
          }}
        >
          {t('name')}
        </Text>
        <StyledTextInput
          value={name}
          placeholder={t('name')}
          style={{
            marginTop: 40,
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
            fontWeight: 'bold',
          }}
        >
          {t('username')}
        </Text>
        <StyledTextInput
          placeholder={t('username')}
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
        isPending={isCheckingUsername}
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
            inviteCode: '',
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
