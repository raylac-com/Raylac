import MultiLineInput from '@/components/MultiLineInput';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamsList, 'AngelRequestDetails'>;

const AngelRequestDetails = ({ route }: Props) => {
  const navigation = useTypedNavigation();
  const { angelRequestId } = route.params;

  const { data: angelRequest } = trpc.getAngelRequest.useQuery({
    angelRequestId,
  });

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
        <Text
          style={{
            fontSize: fontSizes.large,
            fontWeight: 'bold',
            color: colors.text,
            textAlign: 'center',
          }}
        >
          {`$${angelRequest?.amount}`}
        </Text>
        <MultiLineInput
          placeholder="Description"
          value={angelRequest?.description}
          onChangeText={() => {}}
        />
      </View>
      <View style={{ flexDirection: 'column', rowGap: spacing.small }}>
        <StyledButton title="Copy link" onPress={() => {}} variant="primary" />
        <StyledButton
          title="Edit"
          onPress={() => {
            navigation.navigate('EditAngelRequest', {
              angelRequestId,
            });
          }}
          variant="outline"
        />
      </View>
    </View>
  );
};

export default AngelRequestDetails;
