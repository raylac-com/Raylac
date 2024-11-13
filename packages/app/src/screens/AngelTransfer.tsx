import FastAvatar from '@/components/FastAvatar';
import StyledButton from '@/components/StyledButton';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

// Make the actual angel transfer.
// Create a transfer transaction with angel request id.

type Props = NativeStackScreenProps<RootStackParamsList, 'AngelTransfer'>;

const AngelTransfer = ({ route }: Props) => {
  const { angelRequestId } = route.params;

  const { data: angelRequest, isPending } = trpc.getAngelRequest.useQuery({
    angelRequestId,
  });

  if (!angelRequest) {
    return null;
  }

  if (!isPending && !angelRequest) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
          {`Angel request not found`}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <View
        style={{
          flex: 0.62,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: 16,
        }}
      >
        <FastAvatar
          address={publicKeyToAddress(angelRequest?.user.spendingPubKey as Hex)}
          size={80}
          imageUrl={angelRequest?.user.profileImage}
        ></FastAvatar>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.text,
          }}
        >
          {angelRequest?.user.name}
        </Text>
        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            color: theme.text,
            opacity: 0.6,
          }}
        >
          {angelRequest?.description}
        </Text>
      </View>
      <StyledButton style={{ width: '100%' }} title="Pay" onPress={() => {}} />
    </View>
  );
};

export default AngelTransfer;
