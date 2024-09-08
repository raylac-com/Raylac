import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import UsernameAvailabilityIndicator from '@/components/UsernameAvailabilityIndicator';
import useCheckUsername from '@/hooks/useCheckUsername';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { trpc } from '@/lib/trpc';
import { isValidUsername } from '@/lib/username';
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

  const { isUsernameAvailable, isCheckingUsername } =
    useCheckUsername(newUsername);

  const canSave =
    isValidUsername(newUsername) && isUsernameAvailable && !isCheckingUsername;

  const { mutateAsync: updateUsername, isPending: isUpdating } =
    trpc.updateUsername.useMutation();

  const navigation = useTypedNavigation();

  useEffect(() => {
    if (signedInUser.username) {
      setNewUsername(signedInUser.username);
    }
  }, [signedInUser]);

  const onSavePress = useCallback(async () => {
    // Save the new name
    await updateUsername({ username: newUsername });
    await queryClient.invalidateQueries({
      queryKey: userKeys.signedInUser,
    });

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
      <UsernameAvailabilityIndicator
        isPending={isCheckingUsername}
        isUsernameAvailable={
          isUsernameAvailable || newUsername === signedInUser?.username
        }
        username={newUsername}
      ></UsernameAvailabilityIndicator>
      <StyledButton
        style={{
          marginTop: 12,
        }}
        title={t('save')}
        disabled={
          !canSave ||
          newUsername === signedInUser?.username ||
          newUsername === '' ||
          isUpdating
        }
        onPress={onSavePress}
      ></StyledButton>
    </View>
  );
};

export default UpdateUsername;
