import { View } from 'react-native';
import TokenLogo from '../TokenLogo/TokenLogo';
import ChainLogo from '../ChainLogo/ChainLogo';

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
        <View style={{ marginLeft: -size / 4 }}>
          <ChainLogo chainId={chainId} size={size / 3} />
        </View>
      )}
    </View>
  );
};

export default TokenLogoWithChain;
