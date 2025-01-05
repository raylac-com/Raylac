import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import colors from '@/lib/styles/colors';
import TokenLogo from '../TokenLogo/TokenLogo';
import { SwapHistoryItem } from '@raylac/shared';

const SwapHistoryListItem = (props: { swap: SwapHistoryItem }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderColor: colors.border,
        borderBottomWidth: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <TokenLogo
          source={{
            uri: props.swap.tokenIn.logoURI,
          }}
          style={{ width: 38, height: 38 }}
        />
        <AntDesign name="arrowright" size={24} color={colors.subbedText} />
        <TokenLogo
          source={{
            uri: props.swap.tokenOut.logoURI,
          }}
          style={{ width: 38, height: 38 }}
        />
        <StyledText style={{ fontWeight: 'bold' }}>
          {`$${Number(props.swap.amountInUsd).toFixed(2)}`}
        </StyledText>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}
      >
        <StyledText>{`Swap`}</StyledText>
        <Entypo name="swap" size={19} color={colors.green} />
      </View>
    </View>
  );
};

export default SwapHistoryListItem;
