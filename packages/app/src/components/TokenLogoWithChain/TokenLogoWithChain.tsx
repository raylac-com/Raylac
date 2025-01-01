import { getChainIcon } from '@/lib/utils';
import { View } from 'react-native';
import TokenLogo from '../FastImage/TokenLogo';
import { Image } from 'expo-image';

const TokenLogoWithChain = ({
  logoURI,
  chainId,
  size = 24,
}: {
  logoURI: string | null;
  chainId: number | null;
  size?: number;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {logoURI !== null ? (
        <TokenLogo
          source={{ uri: logoURI }}
          style={{ width: size, height: size }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size,
            backgroundColor: '#D9D9D9',
          }}
        />
      )}
      {chainId !== null && (
        <Image
          source={getChainIcon(chainId)}
          style={{
            width: size / 2,
            height: size / 2,
            marginLeft: -size / 4,
          }}
        />
      )}
    </View>
  );
};

export default TokenLogoWithChain;
