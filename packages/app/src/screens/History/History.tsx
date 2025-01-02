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
import useUserAddresses from '@/hooks/useUserAddresses';
import HistoryListItem from '@/components/HistoryListItem/HistoryListItem';

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
          rowGap: 24,
        }}
        data={swapHistory ?? []}
        renderItem={({ item }) => {
          return (
            <Pressable onPress={() => {}}>
              <HistoryListItem transfer={item} />
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
