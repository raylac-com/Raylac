import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';

interface LoadingIndicatorProps {
  size: number;
}

const LoadingIndicator = (props: LoadingIndicatorProps) => {
  const { size } = props;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = () => {
      rotateValue.setValue(0);
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startRotation());
    };
    startRotation();
  }, [rotateValue]);

  const rotateInterpolation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
      <View
        style={{
          width: size,
          height: size,
          borderWidth: size / 10,
          borderRadius: size / 2,
          borderColor: '#ccc',
          borderTopColor: '#1E90FF',
        }}
      />
    </Animated.View>
  );
};

export default LoadingIndicator;
