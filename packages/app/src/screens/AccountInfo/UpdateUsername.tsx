import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { trpc } from '@/lib/trpc';
import userKeys from '@/queryKeys/userKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const UpdateUsername = () => {
  const { data: signedInUser } = useSignedInUser();
  const [newUsername, setNewUsername] = useState<string>('');

  const queryClient = useQueryClient();

  const { t } = useTranslation('UpdateUsername');

  const { mutateAsync: updateUsername, isPending: isUpdating } =
    trpc.updateUsername.useMutation({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: userKeys.signedInUser,
        });
      },
    });

  const navigation = useTypedNavigation();

  useEffect(() => {
    if (signedInUser.username) {
      setNewUsername(signedInUser.username);
    }
  }, [signedInUser.username]);

  const onSavePress = useCallback(async () => {
    // Save the new name
    await updateUsername({ username: newUsername });

    navigation.goBack();
  }, [newUsername]);

  return (
    <View
      style={{
        marginTop: 12,
        alignItems: 'center',
      }}
    >
      <StyledTextInput
        placeholder={t('username')}
        value={newUsername}
        onChangeText={setNewUsername}
      ></StyledTextInput>
      <StyledButton
        style={{
          marginTop: 12,
        }}
        title={t('save')}
        disabled={
          newUsername === signedInUser.username ||
          newUsername === '' ||
          isUpdating
        }
        onPress={onSavePress}
      ></StyledButton>
    </View>
  );
};

export default UpdateUsername;
