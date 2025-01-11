import { Image } from 'expo-image';

const RelayLogo = ({ size = 24 }: { size?: number }) => {
  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('../../../assets/relay.png')}
      style={{ width: size, height: size }}
    />
  );
};

export default RelayLogo;
