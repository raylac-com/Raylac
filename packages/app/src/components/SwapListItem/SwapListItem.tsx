import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import colors from '@/lib/styles/colors';
import TokenLogo from '../TokenLogo/TokenLogo';
import { SwapHistoryItem } from '@raylac/shared';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';

const SwapListItem = (props: { swap: SwapHistoryItem }) => {
  return (
    <View>
      <FeedbackPressable
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
        >
          <View style={{ flexDirection: 'column' }}>
            <View>
              <TokenLogo
                source={{ uri: props.swap.tokenIn.logoURI }}
                style={{ width: 36, height: 36 }}
              />
            </View>
            <View style={{ marginTop: -24 }}>
              <TokenLogoWithChain
                logoURI={props.swap.tokenOut.logoURI}
                chainId={props.swap.toChainId}
                size={42}
              />
            </View>
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
              <StyledText style={{ color: colors.border }}>{`Swap`}</StyledText>
              <Feather name={'repeat'} size={16} color={colors.subbedText} />
            </View>
            <StyledText
              style={{ fontWeight: 'bold', color: colors.subbedText }}
            >
              {`${props.swap.tokenIn.symbol} →  ${props.swap.tokenOut.symbol}`}
            </StyledText>
          </View>
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}
        >
          <StyledText style={{ fontWeight: 'bold' }}>
            {`$${props.swap.amountIn.usdValueFormatted}`}
          </StyledText>
        </View>
      </FeedbackPressable>
    </View>
  );
};

export default SwapListItem;
