import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import StyledText from '../StyledText/StyledText';
import Feather from '@expo/vector-icons/Feather';
import { shortenAddress } from '@/lib/utils';
import {
  HistoryItemType,
  isRelayReceiverAddress,
  TransferHistoryItem,
} from '@raylac/shared';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { useState } from 'react';
import TransferListItemSheet from '../TransferListItemSheet/TransferListItemSheet';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';
import useEnsName from '@/hooks/useEnsName';

const LABELS: Record<Exclude<HistoryItemType, HistoryItemType.SWAP>, string> = {
  [HistoryItemType.OUTGOING]: 'Sent',
  [HistoryItemType.INCOMING]: 'Received',
  [HistoryItemType.MOVE_FUNDS]: 'Move Funds',
  [HistoryItemType.PENDING]: 'Pending',
};

const ICONS: Record<
  Exclude<HistoryItemType, HistoryItemType.SWAP>,
  keyof typeof Feather.glyphMap
> = {
  [HistoryItemType.OUTGOING]: 'send',
  [HistoryItemType.INCOMING]: 'arrow-down-circle',
  [HistoryItemType.MOVE_FUNDS]: 'arrow-right-circle',
  [HistoryItemType.PENDING]: 'clock',
};

const COLORS: Record<Exclude<HistoryItemType, HistoryItemType.SWAP>, string> = {
  [HistoryItemType.OUTGOING]: colors.angelPink,
  [HistoryItemType.INCOMING]: colors.green,
  [HistoryItemType.MOVE_FUNDS]: colors.subbedText,
  [HistoryItemType.PENDING]: colors.subbedText,
};

const TransferListItem = (props: { transfer: TransferHistoryItem }) => {
  const label =
    LABELS[
      props.transfer.type as Exclude<HistoryItemType, HistoryItemType.SWAP>
    ];

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: senderEnsName } = useEnsName(props.transfer.from);
  const { data: recipientEnsName } = useEnsName(props.transfer.to);

  return (
    <View>
      <FeedbackPressable
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onPress={() => setIsSheetOpen(true)}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
        >
          <TokenLogoWithChain
            chainId={
              props.transfer.type === HistoryItemType.INCOMING
                ? props.transfer.toChainId
                : props.transfer.fromChainId
            }
            logoURI={props.transfer.token.logoURI}
            size={42}
          />
          <View
            style={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              rowGap: 4,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 4,
              }}
            >
              <StyledText style={{ color: colors.border }}>{label}</StyledText>
              <Feather
                name={
                  ICONS[
                    props.transfer.type as Exclude<
                      HistoryItemType,
                      HistoryItemType.SWAP
                    >
                  ]
                }
                size={18}
                color={
                  COLORS[
                    props.transfer.type as Exclude<
                      HistoryItemType,
                      HistoryItemType.SWAP
                    >
                  ]
                }
              />
            </View>
            <StyledText
              style={{ fontWeight: 'bold', color: colors.subbedText }}
            >
              {isRelayReceiverAddress(props.transfer.to)
                ? 'Relay Receiver'
                : props.transfer.type === HistoryItemType.INCOMING
                  ? senderEnsName || shortenAddress(props.transfer.from)
                  : recipientEnsName || shortenAddress(props.transfer.to)}
            </StyledText>
          </View>
        </View>
        <StyledText style={{ fontWeight: 'bold' }}>
          {`$${props.transfer.amount.usdValueFormatted}`}
        </StyledText>
      </FeedbackPressable>
      {isSheetOpen && (
        <TransferListItemSheet
          transfer={props.transfer}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </View>
  );
};

export default TransferListItem;