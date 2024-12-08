import { getChainIcon } from '@/lib/utils';
import { View, Image } from 'react-native';

const TokenImageWithChain = ({
  logoURI,
  chainId,
}: {
  logoURI: string;
  chainId: number;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Image source={{ uri: logoURI }} width={24} height={24} />
      <Image
        source={getChainIcon(chainId)}
        width={12}
        height={12}
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
