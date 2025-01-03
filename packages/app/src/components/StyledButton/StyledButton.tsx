import colors from '@/lib/styles/colors';
import { ActivityIndicator, Pressable, PressableProps } from 'react-native';
import StyledText from '../StyledText/StyledText';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { hapticOptions } from '@/lib/utils';

type StyledButtonProps = PressableProps & {
  isLoading?: boolean;
  title: string;
  variant?: 'primary' | 'outline';
  icon?: React.ReactNode;
};

const StyledButton = ({
  title,
  isLoading,
  variant = 'primary',
  icon,
  ...props
}: StyledButtonProps) => {
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
        // Trigger haptic feedback
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);

        props.onPress?.(e);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            height: 50,
            backgroundColor:
              variant === 'primary' ? colors.text : colors.background,
            borderColor:
              variant === 'primary' ? colors.background : colors.text,
            borderWidth: variant === 'primary' ? 0 : 1,
            opacity: props.disabled ? 0.5 : 1,
            borderRadius: 32,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            columnGap: 8,
          },
          animatedStyle,
        ]}
      >
        {icon}
        {isLoading ? (
          <ActivityIndicator
            size={24}
            color={variant === 'primary' ? colors.background : colors.text}
          />
        ) : (
          <StyledText
            style={{
              color: variant === 'primary' ? colors.background : colors.text,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            {title}
          </StyledText>
        )}
      </Animated.View>
    </Pressable>
  );
};

export default StyledButton;
