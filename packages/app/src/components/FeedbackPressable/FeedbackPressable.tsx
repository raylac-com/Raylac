import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { hapticOptions } from '@/lib/utils';
import { Pressable, PressableProps } from 'react-native';

const FeedbackPressable = ({ children, ...props }: PressableProps) => {
  return (
    <Pressable
      onPress={e => {
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
        props.onPress?.(e);
      }}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export default FeedbackPressable;
