import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import StyledText from '@/components/StyledText/StyledText';
import { shortenAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { getColorForAddress } from '@raylac/shared';

const GradientAvatar = ({
  address,
  size = 24,
}: {
  address: Hex;
  size?: number;
}) => {
  const color = getColorForAddress(address);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 1000,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    ></View>
  );
};

const WalletIconAddress = ({ address }: { address: Hex }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
      <GradientAvatar address={address} size={20} />
      <StyledText style={{ fontWeight: 'bold', color: colors.border }}>
        {shortenAddress(address)}
      </StyledText>
    </View>
  );
};

export default WalletIconAddress;
