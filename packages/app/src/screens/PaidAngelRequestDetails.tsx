import FastAvatar from '@/components/FastAvatar';
import MultiLineInput from '@/components/MultiLineInput';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import { UserAngelRequestReturnType } from '@/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamsList, 'AngelRequestDetails'>;

const PaidAngelRequestDetails = ({ route }: Props) => {
  const { angelRequestId } = route.params;

  const { data: angelRequest } = trpc.getAngelRequest.useQuery({
    angelRequestId,
  });

  if (!angelRequest) {
    return null;
  }

  let paidBy:
    | UserAngelRequestReturnType['paidBy'][0]['transactions'][0]['traces'][0]['UserStealthAddressFrom']['user']
    | null = null;

  if (angelRequest.paidBy?.length > 0) {
    paidBy =
      angelRequest.paidBy[0].transactions[0].traces[0].UserStealthAddressFrom
        .user;
  }

  if (!paidBy) {
    // TODO: Report error here
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: spacing.base,
      }}
    >
      <View style={{ flexDirection: 'column', rowGap: spacing.base }}>
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.small,
          }}
        >
          <Text style={{ fontSize: fontSizes.base, color: colors.gray }}>
            {'Paid by'}
          </Text>
          <FastAvatar
            size={64}
            imageUrl={paidBy.profileImage}
            name={paidBy.name}
          />
          <Text
            style={{
              fontSize: fontSizes.large,
              color: colors.text,
              fontWeight: 'bold',
            }}
          >
            {paidBy.name}
          </Text>
        </View>

        <Text
          style={{
            fontSize: fontSizes.xLarge,
            fontWeight: 'bold',
            color: colors.angelPink,
            textAlign: 'center',
          }}
        >
          {`$${angelRequest?.amount}`}
        </Text>
        <Text style={{ fontSize: fontSizes.base, color: colors.text }}>
          {angelRequest?.title}
        </Text>
        <MultiLineInput
          placeholder="Description"
          value={angelRequest?.description}
          onChangeText={() => {}}
          editable={false}
        />
      </View>
    </View>
  );
};

export default PaidAngelRequestDetails;
