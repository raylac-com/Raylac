import { getChainIcon } from '@/lib/utils';
import { View } from 'react-native';
import TokenLogo from '../FastImage/TokenLogo';
import { Image } from 'expo-image';

const TokenImageWithChain = ({
  logoURI,
  chainId,
  size = 24,
}: {
  logoURI: string;
  chainId: number;
  size?: number;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <TokenLogo
        source={{ uri: logoURI }}
        style={{ width: size, height: size }}
      />
      <Image
        source={getChainIcon(chainId)}
        style={{
          width: size / 2,
          height: size / 2,
          marginLeft: -size / 4,
        }}
      />
    </View>
  );
};

export default TokenImageWithChain;
