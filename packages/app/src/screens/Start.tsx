import StyledButton from '@/components/StyledButton';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import { useSignIn } from '@/hooks/useSIgnIn';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { getMnemonic } from '@/lib/key';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * This screen in shown when the user is not signed in.
 * The user can either sign in or create an account.
 */
const Start = () => {
  const { t } = useTranslation('Start');
  const navigation = useTypedNavigation();
  const { data: isSignedIn } = useIsSignedIn();
  const { mutateAsync: signIn } = useSignIn();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mnemonicExists, setMnemonicExists] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const mnemonic = await getMnemonic();
      setMnemonicExists(!!mnemonic);
    })();
  }, []);

  const onSignInPress = useCallback(async () => {
    setIsSigningIn(true);
    const mnemonic = await getMnemonic();

    if (mnemonic) {
      // If mnemonic exists, sign in with it
      await signIn({ mnemonic });
      setIsSigningIn(false);
      navigation.navigate('Tabs', {
        screen: 'Home',
      });
    } else {
      navigation.navigate('SignIn');
      setIsSigningIn(false);
    }
  }, [setIsSigningIn]);

  if (isSignedIn) {
    navigation.navigate('Tabs', {
      screen: 'Home',
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
        title={t('signIn')}
        onPress={onSignInPress}
        isLoading={isSigningIn}
        style={{
          justifyContent: 'center',
          width: mnemonicExists ? 110 : 160,
        }}
      ></StyledButton>
      {mnemonicExists ? null : ( // Don't show the "Create account" button if the mnemonic exists
        <StyledButton
          title={t('createAccount')}
          onPress={() => {
            navigation.navigate('EnterInviteCode');
          }}
          style={{
            justifyContent: 'center',
            width: 160,
          }}
        ></StyledButton>
      )}
    </View>
  );
};

export default Start;
