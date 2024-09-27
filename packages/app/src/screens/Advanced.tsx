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
import { Alert, View } from 'react-native';

const Advanced = () => {
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: deleteAccount } = trpc.deleteAccount.useMutation();
  const queryClient = useQueryClient();

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
      }}
    >
      <StyledButton
        title="Delete account"
        onPress={onDeleteAccountPress}
        style={{
          backgroundColor: theme.waning,
        }}
      ></StyledButton>
    </View>
  );
};

export default Advanced;
