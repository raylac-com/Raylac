import useUserAddress from '@/hooks/useUserAddress';
import { trpc } from '@/lib/trpc';
import { View, FlatList } from 'react-native';
import SwapHistoryListItem from '@/components/SwapHistoryListItem/SwapHistoryListItem';

const History = () => {
  const { data: address } = useUserAddress();

  const { data: swapHistory = [] } = trpc.getSwapHistory.useQuery(
    {
      address: address!,
    },
    {
      enabled: !!address,
    }
  );

  return (
    <View>
      <FlatList
        contentContainerStyle={{
          paddingVertical: 32,
          paddingHorizontal: 16,
          rowGap: 12,
        }}
        data={swapHistory}
        renderItem={({ item }) => <SwapHistoryListItem swap={item} />}
      />
    </View>
  );
};

export default History;
