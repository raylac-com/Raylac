import FastAvatar from '@/components/FastAvatar';
import StyledButton from '@/components/StyledButton';
import useSignOut from '@/hooks/useSignOut';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useCallback } from 'react';
import { Alert, Text, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

const Account = () => {
  const { data: user } = useSignedInUser();
  const { mutateAsync: signOut } = useSignOut();
  const navigation = useTypedNavigation();

  const onSignOutPress = useCallback(async () => {
    Alert.alert('Sign out?', '', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Sign out',
        onPress: async () => {
          await signOut();
          navigation.navigate('Start');
        },
        style: "destructive"
      },
    ]);
  }, [signOut, navigation]);

  if (!user) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 24,
      }}
    >
      <FastAvatar
        address={publicKeyToAddress(user.spendingPubKey as Hex)}
        size={50}
      ></FastAvatar>
      <Text
        style={{
          fontSize: 24,
          marginTop: 12,
          color: theme.text,
        }}
      >
        {user.name}
      </Text>
      <Text
        style={{
          marginTop: 4,
          opacity: 0.5,
          color: theme.text,
        }}
      >
        @{user.username}
      </Text>
      <Text>Reveal mnemonic</Text>
      <StyledButton
        title="Sign out"
        onPress={onSignOutPress}
        style={{
          marginTop: 128,
        }}
      />
    </View>
  );
};

export default Account;
