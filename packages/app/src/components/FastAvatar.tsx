// import FastImage from 'react-native-fast-image';
import colors from '@/lib/styles/colors';
import makeBlockie from 'ethereum-blockies-base64';
import { Image, Text, View } from 'react-native';

type Props = {
  imageUrl?: string;
  address?: string;
  name?: string;
  size: number;
};

const FastAvatar = (props: Props) => {
  const { imageUrl, address, name, size } = props;

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

  if (name) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 50,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: size / 2,
            color: colors.text,
          }}
        >
          {name[0].toUpperCase()}
        </Text>
      </View>
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
