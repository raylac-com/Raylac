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

const UpdateDisplayName = () => {
  const { data: signedInUser } = useSignedInUser();
  const [newDisplayName, setNewDisplayname] = useState<string>('');

  const queryClient = useQueryClient();

  const { t } = useTranslation('UpdateDisplayName');

  const { mutateAsync: updateDisplayName, isPending: isUpdating } =
    trpc.updateDisplayName.useMutation({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: userKeys.signedInUser,
        });
      },
    });
  const navigation = useTypedNavigation();

  useEffect(() => {
    setNewDisplayname(signedInUser.name);
  }, [signedInUser.name]);

  const onSavePress = useCallback(async () => {
    // Save the new name
    await updateDisplayName({ name: newDisplayName });

    navigation.goBack();
  }, [newDisplayName]);

  return (
    <View
      style={{
        marginTop: 12,
        alignItems: 'center',
        paddingHorizontal: 16,
      }}
    >
      <StyledTextInput
        placeholder={t('displayName')}
        value={newDisplayName}
        onChangeText={setNewDisplayname}
      ></StyledTextInput>
      <StyledButton
        style={{
          marginTop: 12,
        }}
        title={t('save')}
        disabled={
          newDisplayName === signedInUser.name ||
          newDisplayName === '' ||
          isUpdating
        }
        onPress={onSavePress}
      ></StyledButton>
    </View>
  );
};

export default UpdateDisplayName;
