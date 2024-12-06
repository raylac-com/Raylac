import colors from '@/lib/styles/colors';
import { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const Skeleton = (props: ViewProps) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  return (
    <Animated.View
      {...props}
      style={[
        props.style,
        {
          backgroundColor: colors.border,
          opacity,
          borderRadius: 8,
        },
      ]}
    ></Animated.View>
  );
};

export default Skeleton;
