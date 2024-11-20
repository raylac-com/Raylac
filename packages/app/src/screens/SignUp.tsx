import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import useSignUp from '@/hooks/useSignUp';
import { isValidUsername } from '@raylac/shared';
import { RootStackParamsList } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import useCheckUsername from '@/hooks/useCheckUsername';
import UsernameAvailabilityIndicator from '@/components/UsernameAvailabilityIndicator';
import { sleep } from '@raylac/shared';
import spacing from '@/lib/styles/spacing';
import InputLabel from '@/components/InputLabel';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Props = NativeStackScreenProps<RootStackParamsList, 'SignUp'>;

/**
 * Sign up screen
 */
const SignUp = () => {
  const { t } = useTranslation('SignUp');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const { mutateAsync: signUp } = useSignUp();
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { isUsernameAvailable, isCheckingUsername } =
    useCheckUsername(username);

  const canGoNext =
    isValidUsername(username) && isUsernameAvailable && !isCheckingUsername;

  // const { data: isSignedIn } = useIsSignedIn();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamsList>>();

  /*
    useEffect(() => {
    if (isSignedIn === true) {
      navigation.navigate('Tabs', {
        screen: 'Home',
      });
    }
  }, [isSignedIn]);
  */

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        rowGap: spacing.small,
        padding: spacing.small,
      }}
    >
      <View
        style={{
          width: '100%',
          flexDirection: 'column',
          alignItems: 'flex-start',
          rowGap: spacing.xSmall,
        }}
      >
        <InputLabel label={t('name')}></InputLabel>
        <StyledTextInput
          autoFocus
          autoCapitalize="none"
          value={name}
          onChangeText={text => {
            setName(text);
          }}
        ></StyledTextInput>
      </View>
      <View
        style={{
          width: '100%',
          flexDirection: 'column',
          alignItems: 'flex-start',
          rowGap: spacing.xSmall,
        }}
      >
        <InputLabel label={t('username')}></InputLabel>
        <StyledTextInput
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
      <View style={{ width: '100%', marginTop: spacing.base }}>
        <StyledButton
          variant="primary"
          disabled={!canGoNext || isSigningUp}
          onPress={async () => {
            setIsSigningUp(true);
            await sleep(300);

            await signUp({
              name,
              username,
            });
            setIsSigningUp(false);

            navigation.navigate('SaveBackupPhrase');
          }}
          isLoading={isSigningUp}
          title={isSigningUp ? 'Creating wallet...' : t('signUp')}
        ></StyledButton>
      </View>
    </View>
  );
};

export default SignUp;
