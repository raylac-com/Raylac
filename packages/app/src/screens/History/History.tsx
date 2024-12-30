import { trpc } from '@/lib/trpc';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import colors from '@/lib/styles/colors';
import StyledText from '@/components/StyledText/StyledText';
import { GetHistoryReturnType, HistoryItemType } from '@raylac/shared';
import ReceiveHistoryListItem from '@/components/ReceiveHistoryListItem/ReceiveHistoryListItem';
import SendHistoryListItem from '@/components/SendHistoryListItem/SendHistoryListItem';
import useUserAddresses from '@/hooks/useUserAddresses';
import MoveFundsHistoryListItem from '@/components/MoveFundsHistoryListItem/MoveFundsHistoryListItem';

const History = () => {
  const { data: addresses } = useUserAddresses();

  const {
    data: swapHistory,
    isLoading,
    isRefetching,
    refetch,
  } = trpc.getHistory.useQuery(
    {
      addresses: addresses?.map(address => address.address) ?? [],
    },
    {
      enabled: !!addresses,
      refetchOnWindowFocus: true,
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
          return (
            <Pressable onPress={() => {}}>
              {item.type === HistoryItemType.OUTGOING && (
                <SendHistoryListItem
                  transfer={item as GetHistoryReturnType[number]}
                />
              )}
              {item.type === HistoryItemType.INCOMING && (
                <ReceiveHistoryListItem
                  transfer={item as GetHistoryReturnType[number]}
                />
              )}
              {item.type === HistoryItemType.MOVE_FUNDS && (
                <MoveFundsHistoryListItem
                  transfer={item as GetHistoryReturnType[number]}
                />
              )}
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
    </View>
  );
};

export default History;
