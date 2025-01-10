import { trpc } from '@/lib/trpc';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import colors from '@/lib/styles/colors';
import StyledText from '@/components/StyledText/StyledText';
import StyledButton from '@/components/StyledButton/StyledButton';
import TransferListItem from '@/components/TransferListItem/TransferListItem';
import {
  HistoryItemType,
  TransferHistoryItem,
  SwapHistoryItem as SwapHistoryItemType,
  BridgeTransferHistoryItem,
} from '@raylac/shared';
import useUserAddresses from '@/hooks/useUserAddresses';
import SwapListItem from '@/components/SwapListItem/SwapListItem';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootTabsParamsList } from '@/navigation/types';
import { Hex } from 'viem/_types/types/misc';
import BridgeTransferListItem from '@/components/BridgeTransferListItem/BridgeTransferListItem';

type Props = NativeStackScreenProps<RootTabsParamsList, 'History'>;

const History = ({ route }: Props) => {
  const listRef = useRef<FlatList>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 100); // Show button after scrolling 100 units
  };
  const pendingTransfer = route.params?.pendingTransfer;
  const pendingBridgeTransfer = route.params?.pendingBridgeTransfer;
  const pendingSwap = route.params?.pendingSwap;

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

  const history =
    fetchedHistory?.map(item => ({
      ...item,
      isPending: false,
    })) ?? [];

  const isTxConfirmed = (txHash: Hex) => {
    return fetchedHistory?.some(
      item => item.type === HistoryItemType.TRANSFER && item.txHash === txHash
    );
  };

  const isRelayIntentConfirmed = (requestId: string) => {
    return fetchedHistory?.some(
      item =>
        (item.type === HistoryItemType.BRIDGE_TRANSFER ||
          item.type === HistoryItemType.SWAP) &&
        item.relayId === requestId
    );
  };

  if (fetchedHistory) {
    if (pendingTransfer) {
      if (!isTxConfirmed(pendingTransfer.txHash)) {
        // We show the pending transfer in the history as a pending transfer is not confirmed yet
        history.unshift({
          type: HistoryItemType.TRANSFER,
          direction: 'outgoing',
          txHash: pendingTransfer.txHash,
          from: pendingTransfer.from,
          to: pendingTransfer.to,
          fromChainId: pendingTransfer.chainId,
          toChainId: pendingTransfer.chainId,
          amount: pendingTransfer.amount,
          token: pendingTransfer.token,
          timestamp: new Date().toISOString(),
          isPending: true,
        });
      }
    } else if (pendingBridgeTransfer) {
      if (!isRelayIntentConfirmed(pendingBridgeTransfer.requestId)) {
        // We show the pending transfer in the history as a pending transfer is not confirmed yet
        history.unshift({
          type: HistoryItemType.BRIDGE_TRANSFER,
          direction: 'outgoing',
          relayId: pendingBridgeTransfer.requestId,
          from: pendingBridgeTransfer.from,
          to: pendingBridgeTransfer.to,
          fromChainId: pendingBridgeTransfer.fromChainId,
          toChainId: pendingBridgeTransfer.toChainId,
          amount: pendingBridgeTransfer.amount,
          token: pendingBridgeTransfer.token,
          timestamp: new Date().toISOString(),
          inTxHash: '0x',
          outTxHash: '0x',
          isPending: true,
        });
      }
    } else if (pendingSwap) {
      if (!isRelayIntentConfirmed(pendingSwap.requestId)) {
        history.unshift({
          type: HistoryItemType.SWAP,
          relayId: pendingSwap.requestId,
          address: pendingSwap.address,
          amountIn: pendingSwap.inputAmount,
          amountOut: pendingSwap.outputAmount,
          tokenIn: pendingSwap.tokenIn,
          tokenOut: pendingSwap.tokenOut,
          fromChainId: pendingSwap.fromChainId,
          toChainId: pendingSwap.toChainId,
          inTxHash: '0x',
          outTxHash: '0x',
          timestamp: new Date().toISOString(),
          isPending: true,
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
        ref={listRef}
        onScroll={handleScroll}
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
                <SwapListItem
                  swap={item as SwapHistoryItemType}
                  isPending={item.isPending}
                />
              ) : item.type === HistoryItemType.BRIDGE_TRANSFER ? (
                <BridgeTransferListItem
                  transfer={item as BridgeTransferHistoryItem}
                  isPending={item.isPending}
                />
              ) : (
                <TransferListItem
                  transfer={item as TransferHistoryItem}
                  isPending={item.isPending}
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
      {showScrollToTop && (
        <View style={{ position: 'absolute', bottom: 24, right: 24 }}>
          <StyledButton
            title="Back to Top"
            variant="primary"
            onPress={() => {
              if (listRef.current) {
                listRef.current.scrollToOffset({ offset: 0, animated: true });
              }
            }}
          />
        </View>
      )}
    </View>
  );
};

export default History;
