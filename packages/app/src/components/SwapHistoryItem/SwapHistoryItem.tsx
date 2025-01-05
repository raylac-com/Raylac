import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import StyledText from '../StyledText/StyledText';
import { shortenAddress } from '@/lib/utils';
import { SwapHistoryItem as SwapHistoryItemType } from '@raylac/shared';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { useState } from 'react';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';

interface SwapHistoryItemProps {
  swap: SwapHistoryItemType;
}

const SwapHistoryItem = (props: SwapHistoryItemProps) => {
  const [_isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <View>
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
            <View>
              <TokenLogoWithChain
                chainId={props.swap.fromChainId}
                logoURI={props.swap.tokenIn.logoURI}
                size={42}
              />
              <TokenLogoWithChain
                chainId={props.swap.toChainId}
                logoURI={props.swap.tokenOut.logoURI}
                size={42}
              />
            </View>
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
                  {`Swap`}
                </StyledText>
              </View>
              <StyledText
                style={{ fontWeight: 'bold', color: colors.subbedText }}
              >
                {shortenAddress(props.swap.address)}
              </StyledText>
            </View>
          </View>
          <StyledText style={{ fontWeight: 'bold' }}>
            {`$${props.swap.amountIn.usdValueFormatted}`}
          </StyledText>
        </FeedbackPressable>
      </View>
    </View>
  );
};

export default SwapHistoryItem;
