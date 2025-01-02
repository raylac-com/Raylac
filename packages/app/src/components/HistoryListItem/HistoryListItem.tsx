import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import StyledText from '../StyledText/StyledText';
import Feather from '@expo/vector-icons/Feather';
import { shortenAddress } from '@/lib/utils';
import { GetHistoryReturnType, HistoryItemType } from '@raylac/shared';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { useState } from 'react';
import HistoryListItemSheet from '../HistoryListItemSheet/HistoryListItemSheet';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';

const LABELS: Record<HistoryItemType, string> = {
  [HistoryItemType.OUTGOING]: 'Sent',
  [HistoryItemType.INCOMING]: 'Received',
  [HistoryItemType.MOVE_FUNDS]: 'Move Funds',
  [HistoryItemType.PENDING]: 'Pending',
};

const ICONS: Record<HistoryItemType, keyof typeof Feather.glyphMap> = {
  [HistoryItemType.OUTGOING]: 'send',
  [HistoryItemType.INCOMING]: 'arrow-down-circle',
  [HistoryItemType.MOVE_FUNDS]: 'arrow-right-circle',
  [HistoryItemType.PENDING]: 'clock',
};

const COLORS: Record<HistoryItemType, string> = {
  [HistoryItemType.OUTGOING]: colors.angelPink,
  [HistoryItemType.INCOMING]: colors.green,
  [HistoryItemType.MOVE_FUNDS]: colors.subbedText,
  [HistoryItemType.PENDING]: colors.subbedText,
};

const HistoryListItem = (props: { transfer: GetHistoryReturnType[number] }) => {
  const label = LABELS[props.transfer.type];
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
            chainId={props.transfer.chainId}
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
                name={ICONS[props.transfer.type]}
                size={18}
                color={COLORS[props.transfer.type]}
              />
            </View>
            <StyledText
              style={{ fontWeight: 'bold', color: colors.subbedText }}
            >
              {shortenAddress(props.transfer.to)}
            </StyledText>
          </View>
        </View>
        <StyledText style={{ fontWeight: 'bold' }}>
          {`$${props.transfer.amount.usdValueFormatted}`}
        </StyledText>
      </FeedbackPressable>
      {isSheetOpen && (
        <HistoryListItemSheet
          transfer={props.transfer}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </View>
  );
};

export default HistoryListItem;
