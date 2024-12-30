import colors from '@/lib/styles/colors';
import { Image, ImageProps } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

const TokenLogo = (props: ImageProps) => {
  const [isError, setIsError] = useState(false);

  // @ts-ignore
  if (isError || props.source?.uri === undefined) {
    return (
      <View
        style={{
          backgroundColor: colors.border,
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
    <View
      style={{
        borderRadius: 1000,
        shadowColor: colors.border,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.7,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Image
        {...props}
        onError={() => setIsError(true)}
        style={{
          ...(typeof props.style === 'object' ? props.style : {}),
        }}
      />
    </View>
  );
};

export default TokenLogo;
