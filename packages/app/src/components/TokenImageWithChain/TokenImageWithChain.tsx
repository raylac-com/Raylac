import { getChainIcon } from '@/lib/utils';
import { View } from 'react-native';
import TokenLogo from '../FastImage/TokenLogo';
import { Image } from 'react-native';

const TokenImageWithChain = ({
  logoURI,
  chainId,
}: {
  logoURI: string;
  chainId: number;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <TokenLogo source={{ uri: logoURI }} style={{ width: 24, height: 24 }} />
      <Image
        source={getChainIcon(chainId)}
        style={{
          width: 12,
          height: 12,
          marginLeft: -6,
        }}
      />
    </View>
  );
};

export default TokenImageWithChain;
