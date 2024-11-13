import StyledButton from '@/components/StyledButton';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import userKeys from '@/queryKeys/userKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Alert, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import useSignOut from '@/hooks/useSignOut';
import fontSizes from '@/lib/styles/fontSizes';

const Advanced = () => {
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: deleteAccount } = trpc.deleteAccount.useMutation();
  const queryClient = useQueryClient();

  const { currentlyRunning, isUpdateAvailable, isUpdatePending } =
    Updates.useUpdates();

  const { mutateAsync: signOut } = useSignOut();

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
            await deleteAccount();
            await signOut();

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
        variant="primary"
        title="Delete account"
        onPress={onDeleteAccountPress}
        style={{
          backgroundColor: colors.warning,
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
            color: colors.text,
            fontSize: fontSizes.small,
          }}
          // eslint-disable-next-line react/jsx-no-literals
        >
          user id: {signedInUser.id}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.small,
          }}
          // eslint-disable-next-line react/jsx-no-literals
        >
          runtime: {currentlyRunning.runtimeVersion}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.small,
          }}
          // eslint-disable-next-line react/jsx-no-literals
        >
          uuid: {currentlyRunning.updateId}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.small,
          }}
          // eslint-disable-next-line react/jsx-no-literals
        >
          channel: {currentlyRunning.channel}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.small,
          }}
          // eslint-disable-next-line react/jsx-no-literals
        >
          update available: {isUpdateAvailable ? 'yes' : 'no'}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.small,
          }}
          // eslint-disable-next-line react/jsx-no-literals
        >
          update pending: {isUpdatePending ? 'yes' : 'no'}
        </Text>
      </View>
    </View>
  );
};

export default Advanced;
