// import { Image, ImageProps } from 'expo-image';
import { Image, ImageProps } from 'react-native';
import { useState } from 'react';
import { View } from 'react-native';

const TokenLogo = (props: ImageProps) => {
  const [isError, setIsError] = useState(false);

  // @ts-ignore
  if (isError || props.source?.uri === undefined) {
    return (
      <View
        style={{
          backgroundColor: '#D9D9D9',
          borderRadius: 1000,
          // @ts-ignore
          width: props.style?.width || undefined,
          // @ts-ignore
          height: props.style?.height || undefined,
        }}
      />
    );
  }

  return (
    <Image
      {...props}
      onError={() => setIsError(true)}
      style={{
        ...(typeof props.style === 'object' ? props.style : {}),
        borderRadius: 1000,
      }}
    />
  );
};

export default TokenLogo;
