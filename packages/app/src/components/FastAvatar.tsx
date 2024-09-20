// import FastImage from 'react-native-fast-image';
import makeBlockie from 'ethereum-blockies-base64';
import { Image } from 'react-native';

type Props = {
  imageUrl?: string;
  address?: string;
  size: number;
};

const FastAvatar = (props: Props) => {
  const { imageUrl, address, size } = props;

  if (imageUrl) {
    return (
      <Image
        style={{
          width: size,
          height: size,
          borderRadius: 50,
        }}
        source={{
          uri: imageUrl,
        }}
      ></Image>
    );
  }

  if (address) {
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
  }

  return null;
};

export default FastAvatar;
