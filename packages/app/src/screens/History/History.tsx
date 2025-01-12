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
import BackToTopButton from './BackToTopButton';
import TransferListItem from '@/components/TransferListItem/TransferListItem';
import {
  HistoryItemType,
  TransferHistoryItem,
  SwapHistoryItem as SwapHistoryItemType,
  BridgeTransferHistoryItem,
  CrossChainSwapHistoryItem,
  BridgeHistoryItem,
} from '@raylac/shared';
import useUserAddresses from '@/hooks/useUserAddresses';
import SwapListItem from '@/components/SwapListItem/SwapListItem';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootTabsParamsList } from '@/navigation/types';
import { Hex } from 'viem/_types/types/misc';
import BridgeTransferListItem from '@/components/BridgeTransferListItem/BridgeTransferListItem';
import BridgeListItem from '@/components/BridgeListItem/BridgeListItem';
import CrossChainSwapListItem from '@/components/CrossChainSwapListItem/CrossChainSwapListItem';

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
  const pendingCrossChainSwap = route.params?.pendingCrossChainSwap;
  const pendingBridge = route.params?.pendingBridge;

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
          item.type === HistoryItemType.SWAP ||
          item.type === HistoryItemType.BRIDGE ||
          item.type === HistoryItemType.CROSS_CHAIN_SWAP) &&
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
          chainId: pendingSwap.chainId,
          txHash: '0x',
          timestamp: new Date().toISOString(),
          isPending: true,
        });
      }
    } else if (pendingCrossChainSwap) {
      if (!isRelayIntentConfirmed(pendingCrossChainSwap.requestId)) {
        history.unshift({
          type: HistoryItemType.CROSS_CHAIN_SWAP,
          relayId: pendingCrossChainSwap.requestId,
          fromChainId: pendingCrossChainSwap.fromChainId,
          toChainId: pendingCrossChainSwap.toChainId,
          address: pendingCrossChainSwap.address,
          amountIn: pendingCrossChainSwap.amountIn,
          amountOut: pendingCrossChainSwap.amountOut,
          tokenIn: pendingCrossChainSwap.tokenIn,
          tokenOut: pendingCrossChainSwap.tokenOut,
          timestamp: new Date().toISOString(),
          inTxHash: '0x',
          outTxHash: '0x',
          isPending: true,
        });
      }
    } else if (pendingBridge) {
      if (!isRelayIntentConfirmed(pendingBridge.requestId)) {
        history.unshift({
          type: HistoryItemType.BRIDGE,
          relayId: pendingBridge.requestId,
          address: pendingBridge.address,
          amountIn: pendingBridge.amountIn,
          amountOut: pendingBridge.amountOut,
          token: pendingBridge.token,
          fromChainId: pendingBridge.fromChainId,
          toChainId: pendingBridge.toChainId,
          timestamp: new Date().toISOString(),
          inTxHash: '0x',
          outTxHash: '0x',
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
              ) : item.type === HistoryItemType.CROSS_CHAIN_SWAP ? (
                <CrossChainSwapListItem
                  swap={item as CrossChainSwapHistoryItem}
                  isPending={item.isPending}
                />
              ) : item.type === HistoryItemType.BRIDGE ? (
                <BridgeListItem
                  bridge={item as BridgeHistoryItem}
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
          <BackToTopButton
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
