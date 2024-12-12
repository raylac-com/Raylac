import { Hex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';
import { Image } from 'expo-image';

interface BlockieProps {
  address: Hex;
  size: number;
}

const Blockie = (props: BlockieProps) => {
  const { address, size } = props;

  return (
    <Image
      style={{
        width: size,
        height: size,
        borderRadius: 50,
      }}
      source={{
        uri: makeBlockie(address),
      }}
    ></Image>
  );
};

export default Blockie;
