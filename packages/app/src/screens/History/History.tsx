import useUserAccount from '@/hooks/useUserAccount';
import { trpc } from '@/lib/trpc';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import SwapHistoryListItem from '@/components/SwapHistoryListItem/SwapHistoryListItem';
import { zeroAddress } from 'viem';
import colors from '@/lib/styles/colors';
import SwapDetailsSheet from '@/sheets/SwapDetailsSheet/SwapDetailsSheet';
import { useState } from 'react';
import { GetSwapHistoryReturnType } from '@/types';

const History = () => {
  const { data: userAccount } = useUserAccount();
  const [selectedSwap, setSelectedSwap] = useState<
    GetSwapHistoryReturnType[number] | null
  >(null);

  const {
    data: swapHistory,
    isLoading,
    isRefetching,
    refetch,
  } = trpc.getSwapHistory.useQuery(
    {
      address: userAccount?.address ?? zeroAddress,
    },
    {
      enabled: !!userAccount,
    }
  );

  return (
    <View style={{ flex: 1 }}>
      {isLoading && (
        <ActivityIndicator
          style={{
            marginTop: 16,
          }}
        />
      )}
      <FlatList
        contentContainerStyle={{
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
        data={swapHistory ?? []}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedSwap(item)}>
            <SwapHistoryListItem swap={item} />
          </Pressable>
        )}
        refreshControl={
          <RefreshControl
            tintColor={colors.primary}
            refreshing={isRefetching}
            onRefresh={async () => {
              await refetch();
            }}
          />
        }
      />
      {selectedSwap && (
        <SwapDetailsSheet
          swap={selectedSwap}
          onClose={() => {
            setSelectedSwap(null);
          }}
        />
      )}
    </View>
  );
};

export default History;
