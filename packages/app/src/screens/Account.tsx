import FastAvatar from '@/components/FastAvatar';
import useSignOut from '@/hooks/useSignOut';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useCallback } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

interface SettingListItemProps {
  title: string;
  onPress: () => void;
  color: string;
}

const SettingListItem = (props: SettingListItemProps) => {
  const { title, onPress, color } = props;

  return (
    <Pressable
      style={{
        padding: 8,
        width: '62%',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: theme.background,
        borderColor: color ? color : theme.text,
      }}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: 16,
          textAlign: 'center',
          color: color ? color : theme.text,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

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
        style: 'destructive',
      },
    ]);
  }, [signOut, navigation]);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 24,
      }}
    >
      {user ? (
        <View style={{
          flexDirection: 'column',
          alignItems: 'center',
        }}>
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
        </View>
      ) : null}
      <View
        style={{
          width: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 24,
          rowGap: 12,
        }}
      >
        <SettingListItem
          title="Backup account"
          onPress={() => navigation.navigate('BackupAccount')}
          color={theme.text}
        />
        <SettingListItem title="Sign out" onPress={onSignOutPress} 
          color={theme.waning}
        />
      </View>
    </View>
  );
};

export default Account;
