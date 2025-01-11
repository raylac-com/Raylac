import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import StyledText from '@/components/StyledText/StyledText';
import { shortenAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { getColorForAddress } from '@raylac/shared';
import fontSizes from '@/lib/styles/fontSizes';

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

const WalletIconAddress = ({
  address,
  fontSize = fontSizes.base,
  avatarSize = 20,
  label,
}: {
  address: Hex;
  fontSize?: number;
  avatarSize?: number;
  label?: string;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
      <GradientAvatar address={address} size={avatarSize} />
      <View style={{ flexDirection: 'column' }}>
        <StyledText
          style={{
            fontWeight: 'bold',
            color: colors.border,
            fontSize: fontSize,
          }}
        >
          {label ? label : shortenAddress(address)}
        </StyledText>
        {label && (
          <StyledText
            style={{
              color: colors.subbedText,
              fontSize: fontSize * 0.85,
            }}
          >
            {shortenAddress(address)}
          </StyledText>
        )}
      </View>
    </View>
  );
};

export default WalletIconAddress;
