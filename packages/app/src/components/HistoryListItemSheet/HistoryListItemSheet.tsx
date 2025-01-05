import Feather from '@expo/vector-icons/Feather';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  getExplorerUrl,
  HistoryItemType,
  isRelayReceiverAddress,
  TransferHistoryItem,
} from '@raylac/shared';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../StyledText/StyledText';
import fontSizes from '@/lib/styles/fontSizes';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import colors from '@/lib/styles/colors';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { Linking, Pressable, View } from 'react-native';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';
import { Hex } from 'viem';
import Toast from 'react-native-toast-message';

type TransferListItemType = Exclude<HistoryItemType, HistoryItemType.SWAP>;

const LABELS: Record<TransferListItemType, string> = {
  [HistoryItemType.OUTGOING]: 'Send',
  [HistoryItemType.INCOMING]: 'Received',
  [HistoryItemType.MOVE_FUNDS]: 'Move Funds',
  [HistoryItemType.PENDING]: 'Pending',
};

export interface HistoryListItemSheetProps {
  transfer: TransferHistoryItem;
  onClose: () => void;
}

const shortenTxHash = (txHash: string) => {
  return `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
};

const FromAddress = ({ address }: { address: Hex }) => {
  const onCopyPress = () => {
    copyToClipboard(address);

    Toast.show({
      type: 'success',
      text1: 'Copied to clipboard',
    });
  };

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>{`From`} </StyledText>
      <FeedbackPressable
        onPress={onCopyPress}
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <Feather name="copy" size={18} color={colors.subbedText} />
        <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
          {isRelayReceiverAddress(address)
            ? 'Relay Receiver'
            : shortenAddress(address)}
        </StyledText>
      </FeedbackPressable>
    </Pressable>
  );
};

const ToAddress = ({ address }: { address: Hex }) => {
  const onCopyPress = () => {
    copyToClipboard(address);

    Toast.show({
      type: 'success',
      text1: 'Copied to clipboard',
    });
  };

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>{`To`} </StyledText>
      <FeedbackPressable
        onPress={onCopyPress}
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <Feather name="copy" size={18} color={colors.subbedText} />
        <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
          {isRelayReceiverAddress(address)
            ? 'Relay Receiver'
            : shortenAddress(address)}
        </StyledText>
      </FeedbackPressable>
    </Pressable>
  );
};

const TxHash = ({ txHash, chainId }: { txHash: string; chainId: number }) => {
  return (
    <FeedbackPressable
      style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      onPress={() => {
        Linking.openURL(`${getExplorerUrl(chainId)}/tx/${txHash}`);
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>
        {`Transaction`}{' '}
      </StyledText>
      <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
        {`${shortenTxHash(txHash)}`}
      </StyledText>
    </FeedbackPressable>
  );
};

const DateTime = ({ date }: { date: Date }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>{`Time`} </StyledText>
      <StyledText style={{ color: colors.subbedText }}>
        {new Date(date).toLocaleDateString()}{' '}
        {new Date(date).toLocaleTimeString()}
      </StyledText>
    </View>
  );
};

const HistoryListItemSheet = ({
  transfer,
  onClose,
}: HistoryListItemSheetProps) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  const label = LABELS[transfer.type as TransferListItemType];

  useEffect(() => {
    ref.current?.present();
  }, []);

  return (
    <BottomSheetModal
      ref={ref}
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 32,
      }}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['100%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          width: '100%',
          flexDirection: 'column',
          rowGap: 24,
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
      >
        <StyledText
          style={{ fontWeight: 'bold', fontSize: fontSizes.large }}
        >{`${label} details`}</StyledText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 16,
          }}
        >
          <TokenLogoWithChain
            logoURI={transfer.token.logoURI}
            chainId={
              transfer.type === HistoryItemType.INCOMING
                ? transfer.toChainId
                : transfer.fromChainId
            }
            size={64}
          />
          <StyledText
            style={{ fontSize: fontSizes.xLarge, fontWeight: 'bold' }}
          >
            {`$${transfer.amount.usdValueFormatted}`}
          </StyledText>
        </View>
        <View
          style={{
            flexDirection: 'column',
            rowGap: 16,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <FromAddress address={transfer.from} />
          <ToAddress address={transfer.to} />
          <TxHash txHash={transfer.txHash} chainId={transfer.toChainId} />
          <DateTime date={new Date(transfer.timestamp)} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default HistoryListItemSheet;
