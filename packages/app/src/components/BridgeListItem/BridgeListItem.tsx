import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import colors from '@/lib/styles/colors';
import TokenLogo from '../TokenLogo/TokenLogo';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';
import BridgeListItemSheet from '../BridgeListItemSheet/BridgeListItemSheet';
import { useState } from 'react';
import PendingIndicator from '../PendingIndicator/PendingIndicator';
import { BridgeHistoryItem, getChainFromId } from '@raylac/shared';

const BridgeListItem = (props: {
  bridge: BridgeHistoryItem;
  isPending: boolean;
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <View>
      <FeedbackPressable
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
        onPress={() => setIsSheetOpen(true)}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
        >
          <TokenLogo
            source={{ uri: props.bridge.token.logoURI }}
            style={{ width: 42, height: 42 }}
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
                columnGap: 16,
              }}
            >
              {props.isPending ? (
                <PendingIndicator />
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: 4,
                  }}
                >
                  <StyledText
                    style={{ color: colors.border }}
                  >{`Bridge`}</StyledText>
                  <Feather
                    name={'repeat'}
                    size={16}
                    color={colors.subbedText}
                  />
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', columnGap: 4 }}>
              <StyledText
                style={{ color: colors.subbedText, fontWeight: 'bold' }}
              >
                {`${getChainFromId(props.bridge.fromChainId).name}`}
              </StyledText>
              <Feather
                name={'arrow-right'}
                size={16}
                color={colors.subbedText}
              />
              <StyledText
                style={{ color: colors.subbedText, fontWeight: 'bold' }}
              >
                {`${getChainFromId(props.bridge.toChainId).name}`}
              </StyledText>
            </View>
          </View>
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}
        >
          <StyledText style={{ fontWeight: 'bold' }}>
            {`$${props.bridge.amountIn.usdValueFormatted}`}
          </StyledText>
        </View>
      </FeedbackPressable>
      {isSheetOpen && (
        <BridgeListItemSheet
          bridge={props.bridge}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </View>
  );
};

export default BridgeListItem;