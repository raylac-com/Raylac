import { getChainIcon } from '@/lib/utils';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';

const TokenImageWithChain = ({
  logoURI,
  chainId,
}: {
  logoURI: string;
  chainId: number;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <FastImage source={{ uri: logoURI }} style={{ width: 24, height: 24 }} />
      <FastImage
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