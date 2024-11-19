import FastAvatar from '@/components/FastAvatar';
import MultiLineInput from '@/components/MultiLineInput';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { copyToClipboard } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { UserAngelRequestReturnType } from '@/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<RootStackParamsList, 'AngelRequestDetails'>;

const AngelRequestDetails = ({ route }: Props) => {
  const { t } = useTranslation('AngelRequestDetails');
  const navigation = useTypedNavigation();
  const { angelRequestId } = route.params;

  const { data: angelRequest } = trpc.getAngelRequest.useQuery({
    angelRequestId,
  });

  const link = `https://raylac.com/request/${angelRequestId}`;

  const onCopyPress = () => {
    copyToClipboard(link);
    Toast.show({
      type: 'success',
      text1: t('copied', { ns: 'common' }),
      position: 'top',
      visibilityTime: 1000,
    });
  };

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
        {paidBy && (
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
              imageUrl={paidBy?.profileImage}
              name={paidBy?.name}
            />
            <Text
              style={{
                fontSize: fontSizes.large,
                color: colors.angelPink,
                fontWeight: 'bold',
              }}
            >
              {paidBy?.name}
            </Text>
          </View>
        )}
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
        <StyledButton
          title="Copy link"
          onPress={onCopyPress}
          variant="primary"
        />
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
