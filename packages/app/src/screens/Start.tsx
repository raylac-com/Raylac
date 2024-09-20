import FastAvatar from '@/components/FastAvatar';
import StyledButton from '@/components/StyledButton';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import { useSignIn } from '@/hooks/useSIgnIn';
import useSignInAvailableUsers from '@/hooks/useSignInAvailableUsers';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { getMnemonic } from '@/lib/key';
import { theme } from '@/lib/theme';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, Text, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

interface SignInAsUserListItemProps {
  onPress: () => void;
  user: {
    spendingPubKey: Hex;
    displayName: string;
    username: string;
    profileImage?: string;
  };
}

const SignInAsUserListItem = (props: SignInAsUserListItemProps) => {
  const { onPress, user } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <FastAvatar
          address={publicKeyToAddress(user.spendingPubKey)}
          size={40}
          imageUrl={user.profileImage}
        ></FastAvatar>
        <View
          style={{
            flexDirection: 'column',
            marginLeft: 8,
          }}
        >
          <Text
            style={{
              color: theme.text,
            }}
          >
            {user.displayName}
          </Text>
          <Text
            style={{
              color: theme.text,
              opacity: 0.6,
              fontSize: 12,
            }}
          >
            @{user.username}
          </Text>
        </View>
      </View>
      <StyledButton
        variant="underline"
        title="Sign in"
        onPress={onPress}
      ></StyledButton>
    </View>
  );
};

/**
 * This screen in shown when the user is not signed in.
 * The user can either sign in or create an account.
 */
const Start = () => {
  const { t } = useTranslation('Start');
  const navigation = useTypedNavigation();
  const { data: isSignedIn } = useIsSignedIn();
  const { mutateAsync: signIn } = useSignIn();

  const { data: signInAvailableUsers } = useSignInAvailableUsers();

  const onCreateAccountPress = useCallback(() => {
    navigation.navigate('SignUp');
  }, [navigation]);

  const onSignInPress = useCallback(async (userId: number) => {
    const mnemonic = await getMnemonic(userId);

    if (!mnemonic) {
      throw new Error('Mnemonic not found');
    }

    await signIn({ mnemonic });
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      navigation.navigate('Tabs', {
        screen: 'Home',
      });
    }
  }, [isSignedIn]);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          rowGap: 8,
        }}
      >
        {signInAvailableUsers?.map(user => (
          <SignInAsUserListItem
            key={user.id}
            user={{
              spendingPubKey: user.spendingPubKey as Hex,
              displayName: user.name,
              username: user.username,
              profileImage: user.profileImage,
            }}
            onPress={() => onSignInPress(user.id)}
          ></SignInAsUserListItem>
        ))}
      </ScrollView>
      <StyledButton
        title={t('createAccount')}
        onPress={onCreateAccountPress}
        style={{
          width: '90%',
          height: 48,
          marginBottom: 32,
        }}
      ></StyledButton>
    </View>
  );
};

export default Start;
