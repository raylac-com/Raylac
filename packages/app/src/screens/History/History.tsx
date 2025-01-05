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
import {
  HistoryItemType,
  TransferHistoryItem,
  SwapHistoryItem as SwapHistoryItemType,
} from '@raylac/shared';
import SwapHistoryItem from '@/components/SwapHistoryItem/SwapHistoryItem';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootTabsParamsList } from '@/navigation/types';
import { Hex } from 'viem/_types/types/misc';

type Props = NativeStackScreenProps<RootTabsParamsList, 'History'>;

const History = ({ route }: Props) => {
  const pendingTransfer = route.params?.pendingTransfer;
  const pendingBridgeTransfer = route.params?.pendingBridgeTransfer;

  const { data: addresses } = useUserAddresses();

  const {
    data: fetchedHistory,
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
      refetchOnMount: true,
    }
  );

  const history = fetchedHistory ?? [];

  const isTxConfirmed = (txHash: Hex) => {
    return fetchedHistory?.some(
      item => item.type === HistoryItemType.OUTGOING && item.txHash === txHash
    );
  };

  const isRelayIntentConfirmed = (requestId: string) => {
    return fetchedHistory?.some(
      item =>
        item.type === HistoryItemType.OUTGOING && item.relayId === requestId
    );
  };

  if (fetchedHistory) {
    if (pendingTransfer) {
      if (!isTxConfirmed(pendingTransfer.txHash)) {
        // We show the pending transfer in the history as a pending transfer is not confirmed yet
        history.unshift({
          type: HistoryItemType.PENDING,
          txHash: '0x',
          from: pendingTransfer.from,
          to: pendingTransfer.to,
          fromChainId: pendingTransfer.chainId,
          toChainId: pendingTransfer.chainId,
          amount: pendingTransfer.amount,
          token: pendingTransfer.token,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (pendingBridgeTransfer) {
      if (!isRelayIntentConfirmed(pendingBridgeTransfer.requestId)) {
        // We show the pending transfer in the history as a pending transfer is not confirmed yet
        history.unshift({
          type: HistoryItemType.PENDING,
          txHash: '0x',
          from: pendingBridgeTransfer.from,
          to: pendingBridgeTransfer.to,
          fromChainId: pendingBridgeTransfer.fromChainId,
          toChainId: pendingBridgeTransfer.toChainId,
          amount: pendingBridgeTransfer.amount,
          token: pendingBridgeTransfer.token,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

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
        data={history ?? []}
        renderItem={({ item }) => {
          return (
            <Pressable onPress={() => {}}>
              {item.type === HistoryItemType.SWAP ? (
                <SwapHistoryItem swap={item as SwapHistoryItemType} />
              ) : (
                <HistoryListItem transfer={item as TransferHistoryItem} />
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
