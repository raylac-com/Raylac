import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import { Hex } from 'viem';
import colors from '@/lib/styles/colors';
import { shortenAddress } from '@/lib/utils';
import Feather from '@expo/vector-icons/Feather';

const SendToCard = ({
  toAddress,
  alignCenter,
}: {
  toAddress: Hex;
  alignCenter?: boolean;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
        justifyContent: alignCenter ? 'center' : 'flex-start',
      }}
    >
      <Feather name="send" size={18} color={colors.border} />
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <StyledText style={{ color: colors.border }}>{`Send to `}</StyledText>
        <StyledText style={{ color: colors.border, fontWeight: 'bold' }}>
          {shortenAddress(toAddress)}
        </StyledText>
      </View>
    </View>
  );
};

export default SendToCard;
