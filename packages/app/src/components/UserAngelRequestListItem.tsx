import FastAvatar from '@/components/FastAvatar';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { shortenText } from '@/lib/utils';
import { UserAngelRequestReturnType } from '@/types';
import { Pressable, Text, View } from 'react-native';

interface UserAngelRequestListItemProps {
  angelRequest: UserAngelRequestReturnType;
}

const UserAngelRequestListItem = ({
  angelRequest,
}: UserAngelRequestListItemProps) => {
  const navigation = useTypedNavigation();

  let paidBy:
    | UserAngelRequestReturnType['paidBy'][0]['transactions'][0]['traces'][0]['UserStealthAddressFrom']['user']
    | null = null;

  if (angelRequest.paidBy.length > 0) {
    paidBy =
      angelRequest.paidBy[0].transactions[0].traces[0].UserStealthAddressFrom
        .user;
  }

  const isPaid = angelRequest.paidBy.length > 0;

  return (
    <Pressable
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        columnGap: spacing.base,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        paddingVertical: spacing.base,
        rowGap: spacing.base,
      }}
      onPress={() => {
        if (angelRequest.paidBy.length > 0) {
          navigation.navigate('PaidAngelRequestDetails', {
            angelRequestId: angelRequest.id,
          });
        } else {
          navigation.navigate('AngelRequestDetails', {
            angelRequestId: angelRequest.id,
          });
        }
      }}
    >
      {paidBy && (
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <FastAvatar
            imageUrl={paidBy.profileImage}
            name={paidBy.name}
            size={24}
          />
        </View>
      )}
      <Text
        style={{
          flex: 6,
          color: isPaid ? colors.angelPink : colors.text,
          fontSize: fontSizes.base,
        }}
      >
        {shortenText(angelRequest.title, 60)}
      </Text>

      <Text
        style={{
          flex: 2,
          color: isPaid ? colors.angelPink : colors.text,
          fontSize: fontSizes.base,
          textAlign: 'right',
        }}
      >{`$${angelRequest.amount}`}</Text>
    </Pressable>
  );
};

export default UserAngelRequestListItem;
