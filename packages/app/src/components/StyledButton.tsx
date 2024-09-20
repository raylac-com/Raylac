import { theme } from '@/lib/theme';
import { useState } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  StyleSheet,
} from 'react-native';

type StyledButtonProps = {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'outline' | 'underline';
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

  let pressableStyle;
  switch (props.variant) {
    case 'primary':
      pressableStyle = styles.primaryButton;
      break;
    case 'outline':
      pressableStyle = styles.outlineButton;
      break;
    case 'underline':
      pressableStyle = styles.underlineButton;
      break;
    default:
      pressableStyle = styles.primaryButton;
  }

  let textStyle;
  switch (props.variant) {
    case 'primary':
      textStyle = {
        color: theme.text,
      };
      break;
    case 'outline':
      textStyle = {
        color: theme.primary,
      };
      break;
    case 'underline':
      textStyle = styles.underlineText;
      break;
    default:
      textStyle = {
        color: theme.text,
      };
  }

  return (
    <Pressable
      {...props}
      style={{
        ...pressableStyle,
        ...style,
        opacity: disabled || isPressed ? 0.4 : 1,
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
          color: theme.text,
          fontWeight: 'bold',
          fontSize: 16,
          ...textStyle,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 30,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: theme.primary,
    borderWidth: 1,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 30,
  },
  underlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  underlineText: {
    textDecorationLine: 'underline',
    textDecorationColor: theme.primary,
    textDecorationStyle: 'solid',
    color: theme.text,
    opacity: 0.7,
  },
});

export default StyledButton;
