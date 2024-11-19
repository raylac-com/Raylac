import FiatAmountInput from '@/components/FiatAmountInput';
import MultiLineInput from '@/components/MultiLineInput';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<RootStackParamsList, 'EditAngelRequest'>;

const EditAngelRequest = ({ route }: Props) => {
  const navigation = useTypedNavigation();
  const { angelRequestId } = route.params;

  const { data: angelRequest } = trpc.getAngelRequest.useQuery({
    angelRequestId,
  });

  const [newAmount, setNewAmount] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  useEffect(() => {
    if (angelRequest) {
      setNewAmount(angelRequest.amount.toString());
      setNewDescription(angelRequest.description);
    }
  }, [angelRequest]);

  const queryClient = useQueryClient();

  const { mutateAsync: updateAngelRequest, isPending: isUpdatingAngelRequest } =
    trpc.updateAngelRequest.useMutation();

  const onSavePress = useCallback(async () => {
    await updateAngelRequest({
      angelRequestId,
      usdAmount: newAmount,
      description: newDescription,
    });

    queryClient.invalidateQueries({
      queryKey: getQueryKey(trpc.getAngelRequest, { angelRequestId }),
    });

    queryClient.invalidateQueries({
      queryKey: getQueryKey(trpc.getUserAngelRequests),
    });

    Toast.show({
      type: 'success',
      text1: 'Saved changes',
      position: 'top',
      visibilityTime: 1000,
    });

    navigation.goBack();
  }, [
    updateAngelRequest,
    newAmount,
    newDescription,
    angelRequestId,
    queryClient,
  ]);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: spacing.base,
      }}
    >
      <View style={{ flexDirection: 'column', rowGap: spacing.small }}>
        <FiatAmountInput
          autoFocus
          amount={newAmount}
          onInputChange={setNewAmount}
        />
        <MultiLineInput
          placeholder="Description"
          value={newDescription}
          onChangeText={setNewDescription}
        />
      </View>
      <View style={{ flexDirection: 'column', rowGap: spacing.small }}>
        <StyledButton
          title="Save"
          onPress={onSavePress}
          variant="primary"
          isLoading={isUpdatingAngelRequest}
        />
      </View>
    </View>
  );
};

export default EditAngelRequest;
