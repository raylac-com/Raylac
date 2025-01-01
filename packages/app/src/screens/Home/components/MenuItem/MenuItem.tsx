import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import colors from '@/lib/styles/colors';
import StyledText from '@/components/StyledText/StyledText';
import { hapticOptions } from '@/lib/utils';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  testID: string;
  onPress: () => void;
  color?: string;
}

const MenuItem = (props: MenuItemProps) => {
  const { icon, title, onPress, testID, color } = props;

  // Shared value for scale animation
  const scale = useSharedValue(1);

  // Animated style based on shared value
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      mass: 0.05,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      mass: 0.05,
    });
  };

  return (
    <Pressable
      onPress={() => {
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
        onPress();
      }}
      style={{}}
      testID={testID}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'column',
            alignItems: 'center',
            rowGap: 8,
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            width: 48,
            height: 48,
            borderRadius: 100,
            borderColor: colors.border,
            borderWidth: 2,
          }}
        >
          {icon}
        </View>
        <StyledText
          style={{
            fontSize: 16,
            color: color ?? colors.text,
            textAlign: 'center',
          }}
        >
          {title}
        </StyledText>
      </Animated.View>
    </Pressable>
  );
};

export default MenuItem;
