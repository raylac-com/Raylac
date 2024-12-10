import colors from '@/lib/styles/colors';
import { ActivityIndicator, Pressable, PressableProps } from 'react-native';
import StyledText from '../StyledText/StyledText';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type StyledButtonProps = PressableProps & {
  isLoading?: boolean;
  title: string;
};

const StyledButton = ({ title, isLoading, ...props }: StyledButtonProps) => {
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
      onPress={e => {
        props.onPress?.(e);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            height: 50,
            backgroundColor: colors.primary,
            opacity: props.disabled ? 0.5 : 1,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
          },
          animatedStyle,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size={24} color="white" />
        ) : (
          <StyledText
            style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
          >
            {title}
          </StyledText>
        )}
      </Animated.View>
    </Pressable>
  );
};

export default StyledButton;
