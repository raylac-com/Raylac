import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { shortenText } from '@/lib/utils';
import { UserAngelRequestReturnType } from '@/types';
import { FlatList, Pressable, Text } from 'react-native';

interface UserAngelRequestItemProps {
  angelRequest: UserAngelRequestReturnType;
}

const UserAngelRequestItem = ({ angelRequest }: UserAngelRequestItemProps) => {
  const navigation = useTypedNavigation();

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
        navigation.navigate('AngelRequestDetails', {
          angelRequestId: angelRequest.id,
        });
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: fontSizes.large,
          fontWeight: 'bold',
        }}
      >{`$${angelRequest.amount}`}</Text>
      <Text
        style={{
          color: colors.text,
          fontSize: fontSizes.base,
          flexShrink: 1,
        }}
      >
        {shortenText(angelRequest.description, 80)}
      </Text>
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
