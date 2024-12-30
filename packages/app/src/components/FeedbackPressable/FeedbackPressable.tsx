import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { hapticOptions } from '@/lib/utils';
import { Pressable } from 'react-native';

const FeedbackPressable = ({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) => {
  return (
    <Pressable
      onPress={() => {
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
        onPress();
      }}
    >
      {children}
    </Pressable>
  );
};

export default FeedbackPressable;
