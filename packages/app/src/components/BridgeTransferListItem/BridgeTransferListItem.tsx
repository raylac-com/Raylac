import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import StyledText from '../StyledText/StyledText';
import Feather from '@expo/vector-icons/Feather';
import { shortenAddress } from '@/lib/utils';
import { BridgeTransferHistoryItem } from '@raylac/shared';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { useState } from 'react';
import BridgeTransferListItemSheet from '../BridgeTransferListItemSheet/BridgeTransferListItemSheet';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';
import useEnsName from '@/hooks/useEnsName';

const BridgeTransferListItem = (props: {
  transfer: BridgeTransferHistoryItem;
}) => {
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
              props.transfer.direction === 'incoming'
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
              <StyledText style={{ color: colors.border }}>
                {props.transfer.direction === 'incoming' ? 'Received' : 'Sent'}
              </StyledText>
              <Feather
                name={
                  props.transfer.direction === 'incoming'
                    ? 'arrow-down-circle'
                    : 'arrow-up-circle'
                }
                size={18}
                color={colors.border}
              />
            </View>
            <StyledText
              style={{ fontWeight: 'bold', color: colors.subbedText }}
            >
              {props.transfer.direction === 'incoming'
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
        <BridgeTransferListItemSheet
          transfer={props.transfer}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </View>
  );
};

export default BridgeTransferListItem;
