import { View } from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';
import colors from '@/lib/styles/colors';
import StyledText from '@/components/StyledText/StyledText';
import { shortenAddress } from '@/lib/utils';
import { Hex } from 'viem';

const WalletIconAddress = ({ address }: { address: Hex }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
      <Entypo name="wallet" size={20} color={colors.border} />
      <StyledText style={{ fontWeight: 'bold', color: colors.border }}>
        {shortenAddress(address)}
      </StyledText>
    </View>
  );
};

export default WalletIconAddress;
