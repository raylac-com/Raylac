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
import StyledText from '@/components/StyledText/StyledText';
import {
  HistoryItem,
  SwapHistoryItem,
  TransferHistoryItem,
} from '@raylac/shared';
import SendHistoryListItem from '@/components/SendHistoryListItem/SendHistoryListItem';

const History = () => {
  const { data: userAccount } = useUserAccount();
  const [selectedSwap, setSelectedSwap] = useState<HistoryItem | null>(null);

  const {
    data: swapHistory,
    isLoading,
    isRefetching,
    refetch,
  } = trpc.getHistory.useQuery(
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
        ListEmptyComponent={() => (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <StyledText
              style={{
                color: colors.subbedText,
              }}
            >{`No activity yet`}</StyledText>
          </View>
        )}
        contentContainerStyle={{
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
        data={swapHistory ?? []}
        renderItem={({ item }) => {
          if ('token' in item) {
            return (
              <Pressable onPress={() => {}}>
                <SendHistoryListItem transfer={item as TransferHistoryItem} />
              </Pressable>
            );
          }

          return (
            <Pressable onPress={() => setSelectedSwap(item)}>
              <SwapHistoryListItem swap={item as SwapHistoryItem} />
            </Pressable>
          );
        }}
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
          swap={selectedSwap as SwapHistoryItem}
          onClose={() => {
            setSelectedSwap(null);
          }}
        />
      )}
    </View>
  );
};

export default History;
