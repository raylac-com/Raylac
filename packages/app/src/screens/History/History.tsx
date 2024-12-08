import useUserAccount from '@/hooks/useUserAccount';
import { trpc } from '@/lib/trpc';
import { FlatList, View } from 'react-native';
import SwapHistoryListItem from '@/components/SwapHistoryListItem/SwapHistoryListItem';
import { zeroAddress } from 'viem';

const History = () => {
  const { data: userAccount } = useUserAccount();

  const { data: swapHistory = [] } = trpc.getSwapHistory.useQuery(
    {
      address: userAccount?.address ?? zeroAddress,
    },
    {
      enabled: !!userAccount,
    }
  );

  return (
    <View style={{ flex: 1 }}>
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
