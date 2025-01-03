import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { hapticOptions } from '@/lib/utils';
import { Pressable, PressableProps } from 'react-native';

const FeedbackPressable = ({ children, ...props }: PressableProps) => {
  return (
    <Pressable
      {...props}
      onPress={e => {
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
        props.onPress?.(e);
      }}
    >
      {children}
    </Pressable>
  );
};

export default FeedbackPressable;
