import { useRef } from 'react';
import { Animated, Pressable, PressableProps } from 'react-native';

const StyledPressable = (props: PressableProps) => {
  const style = (props.style ? props.style : {}) as object;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 1,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], ...style }}>
      <Pressable
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{}}
      ></Pressable>
    </Animated.View>
  );
};

export default StyledPressable;
