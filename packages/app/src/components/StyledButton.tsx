import { theme } from '@/lib/theme';
import { useState } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
} from 'react-native';

type StyledButtonProps = {
  title: string;
  isLoading?: boolean;
} & PressableProps;

const StyledButton = (props: StyledButtonProps) => {
  const { title, disabled, isLoading } = props;
  const style = (props.style ? props.style : {}) as object;
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  return (
    <Pressable
      {...props}
      style={{
        ...style,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.text,
        opacity: disabled || isPressed ? 0.4 : 1,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 30,
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
          fontSize: 16,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

export default StyledButton;
