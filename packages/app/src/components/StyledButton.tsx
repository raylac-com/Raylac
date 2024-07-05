import { theme } from '@/lib/theme';
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps
} from 'react-native';

type StyledButtonProps = {
  title: string;
  isLoading?: boolean;
} & PressableProps;

const StyledButton = (props: StyledButtonProps) => {
  const { title, disabled, isLoading } = props;
  const style = (props.style ? props.style : {}) as object;

  return (
    <Pressable
      {...props}
      style={{
        ...style,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary,
        opacity: disabled ? 0.4 : 1,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 30,
      }}
    >
      {
        // Show an activity indicator when the button is loading
        isLoading && (
          <ActivityIndicator
            size="small"
            style={{
              marginRight: 10,
            }}
          ></ActivityIndicator>
        )
      }
      <Text
        style={{
          color: theme.background,
          fontSize  : 16
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

export default StyledButton;
