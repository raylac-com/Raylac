import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import { GetSwapHistoryReturnType } from '@/types';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import colors from '@/lib/styles/colors';
import useTokenMeta from '@/hooks/useTokenMeta';
import { Hex } from 'viem';
import TokenLogo from '../FastImage/TokenLogo';

const SwapHistoryItem = (props: { swap: GetSwapHistoryReturnType[number] }) => {
  const { data: tokenMetaIn } = useTokenMeta(props.swap.tokenAddressIn as Hex);
  const { data: tokenMetaOut } = useTokenMeta(
    props.swap.tokenAddressOut as Hex
  );

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
            uri: tokenMetaIn?.logoURI,
          }}
          style={{ width: 38, height: 38 }}
        />
        <AntDesign name="arrowright" size={24} color={colors.subbedText} />
        <TokenLogo
          source={{
            uri: tokenMetaOut?.logoURI,
          }}
          style={{ width: 38, height: 38 }}
        />
        <StyledText style={{ fontWeight: 'bold' }}>
          {`$${Number(props.swap.usdAmountIn).toFixed(2)}`}
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

export default SwapHistoryItem;
