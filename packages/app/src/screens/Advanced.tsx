import StyledButton from '@/components/StyledButton';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { deleteSignInAvailableUserId } from '@/lib/key';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { getServerId } from '@/lib/utils';
import userKeys from '@/queryKeys/userKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Alert, Text, View } from 'react-native';
import * as Updates from 'expo-updates';

const Advanced = () => {
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: deleteAccount } = trpc.deleteAccount.useMutation();
  const queryClient = useQueryClient();

  const { currentlyRunning,  isUpdateAvailable, isUpdatePending } =
    Updates.useUpdates();

  const navigation = useTypedNavigation();

  const onDeleteAccountPress = useCallback(async () => {
    if (!signedInUser) {
      throw new Error('User not signed in');
    }
    Alert.alert(
      `Delete account @${signedInUser.username}?`,
      'You will lose all of your funds if you don`t have the recovery code',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete account',
          onPress: async () => {
            await deleteSignInAvailableUserId({
              userId: signedInUser.id,
              serverId: getServerId(),
            });
            await deleteAccount();

            await queryClient.invalidateQueries({
              queryKey: userKeys.signedInUser,
            });

            await queryClient.invalidateQueries({
              queryKey: userKeys.isSignedIn,
            });

            navigation.navigate('Start');
          },
          style: 'destructive',
        },
      ]
    );
  }, []);

  if (!signedInUser) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'flex-end',
        marginTop: 16,
        padding: 16,
        rowGap: 16,
      }}
    >
      <StyledButton
        title="Delete account"
        onPress={onDeleteAccountPress}
        style={{
          backgroundColor: theme.waning,
        }}
      ></StyledButton>
      <View
        style={{
          opacity: 0.5,
          flexDirection: 'column',
          justifyContent: 'center',
          rowGap: 4,
        }}
      >
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
          }}
        >
          user: {signedInUser.id}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
          }}
        >
          runtime: {currentlyRunning.runtimeVersion}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
          }}
        >
          uuid: {currentlyRunning.updateId}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
          }}
        >
          channel: {currentlyRunning.channel}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
          }}
        >
          update available: {isUpdateAvailable ? 'yes' : 'no'}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
          }}
        >
          update pending: {isUpdatePending ? 'yes' : 'no'}
        </Text>
      </View>
    </View>
  );
};

export default Advanced;
