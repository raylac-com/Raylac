import AmountInput from '@/components/AmountInput';
import MultiLineInput from '@/components/MultiLineInput';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamsList, 'AngelRequestDetails'>;

const AngelRequestDetails = ({ route }: Props) => {
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

  return (
    <View
      style={{
        flexDirection: 'column',
        paddingHorizontal: 16,
        backgroundColor: theme.background,
      }}
    >
      <View style={{ marginBottom: 16 }}>
        <AmountInput
          amount={newAmount}
          onInputChange={setNewAmount}
          autoFocus={false}
        />
      </View>
      <MultiLineInput
        placeholder="Description"
        value={newDescription}
        onChangeText={setNewDescription}
      />
    </View>
  );
};

export default AngelRequestDetails;
