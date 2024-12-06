import { Image, View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import { GetSwapHistoryReturnType } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import colors from '@/lib/styles/colors';
import useTokenMeta from '@/hooks/useTokenMeta';
import { Hex } from 'viem';

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
        padding: 16,
        borderRadius: 16,
        borderColor: colors.border,
        borderWidth: 1,
        shadowColor: 'black',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <Image
          source={{
            uri: tokenMetaIn?.logoURI,
          }}
          style={{ width: 42, height: 42 }}
        />
        <FontAwesome name="arrow-right" size={24} color="black" />
        <Image
          source={{
            uri: tokenMetaOut?.logoURI,
          }}
          style={{ width: 42, height: 42 }}
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
