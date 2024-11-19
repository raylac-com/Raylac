import FastAvatar from '@/components/FastAvatar';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { shortenText } from '@/lib/utils';
import { UserAngelRequestReturnType } from '@/types';
import { FlatList, Pressable, Text, View } from 'react-native';

interface UserAngelRequestItemProps {
  angelRequest: UserAngelRequestReturnType;
}

const UserAngelRequestItem = ({ angelRequest }: UserAngelRequestItemProps) => {
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
      <Text
        style={{
          flex: 1,
          color: isPaid ? colors.angelPink : colors.text,
          fontSize: fontSizes.large,
          fontWeight: 'bold',
        }}
      >{`$${angelRequest.amount}`}</Text>
      <Text
        style={{
          flex: 5,
          color: isPaid ? colors.angelPink : colors.text,
          fontSize: fontSizes.base,
          flexShrink: 1,
        }}
      >
        {shortenText(angelRequest.description, 80)}
      </Text>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          columnGap: spacing.xxSmall,
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
      </View>
    </Pressable>
  );
};

const UserAngelRequests = () => {
  const { data: angelRequests } = trpc.getUserAngelRequests.useQuery();

  return (
    <FlatList
      data={angelRequests}
      style={{ padding: spacing.base }}
      renderItem={({ item }) => <UserAngelRequestItem angelRequest={item} />}
    />
  );
};

export default UserAngelRequests;
