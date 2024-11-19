import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
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
        flexDirection: 'column',
        borderBottomWidth: 1,
        paddingVertical: 12,
        rowGap: 4,
      }}
      onPress={() => {
        navigation.navigate('AngelRequestDetails', {
          angelRequestId: angelRequest.id,
        });
      }}
    >
      <Text style={{ color: colors.text }}>{angelRequest.description}</Text>
    </Pressable>
  );
};

const UserAngelRequests = () => {
  const { data: angelRequests } = trpc.getUserAngelRequests.useQuery();

  return (
    <FlatList
      data={angelRequests}
      style={{ paddingHorizontal: 16 }}
      renderItem={({ item }) => <UserAngelRequestItem angelRequest={item} />}
    />
  );
};

export default UserAngelRequests;
