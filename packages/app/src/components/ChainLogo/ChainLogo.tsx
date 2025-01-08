import { getChainIcon } from '@/lib/utils';
import { Image } from 'expo-image';

const ChainLogo = (props: { chainId: number; size: number }) => {
  return (
    <Image
      source={getChainIcon(props.chainId)}
      style={{
        width: props.size,
        height: props.size,
      }}
    />
  );
};

export default ChainLogo;
