import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  getExplorerUrl,
  GetHistoryReturnType,
  HistoryItemType,
} from '@raylac/shared';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../StyledText/StyledText';
import fontSizes from '@/lib/styles/fontSizes';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import colors from '@/lib/styles/colors';
import { shortenAddress } from '@/lib/utils';
import { Linking } from 'react-native';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';

const LABELS: Record<HistoryItemType, string> = {
  [HistoryItemType.OUTGOING]: 'Sent',
  [HistoryItemType.INCOMING]: 'Received',
  [HistoryItemType.MOVE_FUNDS]: 'Move Funds',
  [HistoryItemType.PENDING]: 'Pending',
};

export interface HistoryListItemSheetProps {
  transfer: GetHistoryReturnType[number];
  onClose: () => void;
}

const shortenTxHash = (txHash: string) => {
  return `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
};

const HistoryListItemSheet = ({
  transfer,
  onClose,
}: HistoryListItemSheetProps) => {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  const label = LABELS[transfer.type];

  useEffect(() => {
    ref.current?.present();
  }, []);

  return (
    <BottomSheetModal
      ref={ref}
      style={{
        flex: 1,
        paddingBottom: insets.bottom + 32,
      }}
      onDismiss={onClose}
      enablePanDownToClose
      snapPoints={['100%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'flex-start',
          rowGap: 24,
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
      >
        <StyledText
          style={{ fontWeight: 'bold', fontSize: fontSizes.large }}
        >{`${label} details`}</StyledText>
        <TokenLogoWithChain
          logoURI={transfer.token.logoURI}
          chainId={transfer.chainId}
          size={32}
        />
        <StyledText
          style={{ fontSize: fontSizes.twoXLarge, fontWeight: 'bold' }}
        >
          {`$${transfer.amount.usdValueFormatted}`}
        </StyledText>
        <StyledText
          style={{
            color: colors.subbedText,
            fontWeight: 'bold',
          }}
        >
          {`${transfer.amount.formatted} ${transfer.token.symbol}`}
        </StyledText>
        <StyledText style={{ color: colors.subbedText }}>
          {`From ${shortenAddress(transfer.from)} `}
        </StyledText>
        <StyledText style={{ color: colors.subbedText }}>
          {`To ${shortenAddress(transfer.to)} `}
        </StyledText>
        <FeedbackPressable
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => {
            Linking.openURL(
              `${getExplorerUrl(transfer.chainId)}/tx/${transfer.txHash}`
            );
          }}
        >
          <StyledText style={{ color: colors.subbedText }}>
            {`${shortenTxHash(transfer.txHash)}`}
          </StyledText>
        </FeedbackPressable>
        <StyledText style={{ color: colors.subbedText }}>
          {`${new Date(transfer.timestamp).toLocaleDateString()}`}
        </StyledText>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default HistoryListItemSheet;
