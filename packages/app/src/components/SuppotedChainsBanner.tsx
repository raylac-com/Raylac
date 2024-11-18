import { supportedChains } from '@raylac/shared';

import { getChainLogo } from '@/lib/logo';
import { Image, View } from 'react-native';
import { Chain } from 'viem';

const SupportedChainListItem = ({
  size,
  chain,
}: {
  size: number;
  chain: Chain;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image
        source={getChainLogo(chain.id)}
        style={{ width: size, height: size, marginLeft: -8 }}
      />
    </View>
  );
};

interface SupportedChainsBannerProps {
  size: number;
}

const SupportedChainsBanner = ({ size }: SupportedChainsBannerProps) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {supportedChains.map(chain => (
        <SupportedChainListItem key={chain.id} size={size} chain={chain} />
      ))}
    </View>
  );
};

export default SupportedChainsBanner;
