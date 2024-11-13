import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';

/**
 * This screen in shown when the user is not signed in.
 * The user can either sign in or create an account.
 */
const Start = () => {
  const { t } = useTranslation('Start');
  const navigation = useTypedNavigation();

  const onCreateAccountPress = useCallback(() => {
    navigation.navigate('SignUp');
  }, [navigation]);

  const onSignInPress = useCallback(() => {
    navigation.navigate('SignIn');
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../assets/adaptive-icon.png')}
        style={{
          width: 240,
          height: 240,
          resizeMode: 'contain',
          marginTop: 64,
        }}
      ></Image>
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          flexDirection: 'column',
          rowGap: 16,
        }}
      >
        <StyledButton
          title={t('signIn')}
          onPress={onSignInPress}
          style={{
            width: '100%',
            height: 48,
          }}
          variant="outline"
        ></StyledButton>
        <StyledButton
          variant="primary"
          title={t('createAccount')}
          onPress={onCreateAccountPress}
          style={{
            width: '100%',
            height: 48,
          }}
        ></StyledButton>
      </View>
    </View>
  );
};

export default Start;
