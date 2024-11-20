import UserAngelRequestListItem from '@/components/UserAngelRequestListItem';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { FlatList } from 'react-native';

const UserAngelRequests = () => {
  const { data: angelRequests } = trpc.getUserAngelRequests.useQuery();

  return (
    <FlatList
      data={angelRequests}
      style={{ paddingHorizontal: spacing.base }}
      renderItem={({ item }) => (
        <UserAngelRequestListItem angelRequest={item} />
      )}
    />
  );
};

export default UserAngelRequests;
