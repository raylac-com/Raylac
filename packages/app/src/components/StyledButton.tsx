import borderRadius from '@/lib/styles/borderRadius';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import opacity from '@/lib/styles/opacity';
import spacing from '@/lib/styles/spacing';
import React, { useState } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';

type StyledButtonProps = {
  title: string;
  isLoading?: boolean;
  variant: 'primary' | 'outline' | 'underline';
  icon?: React.ReactNode;
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

  const pressableStyle: ViewStyle = {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xSmall,
    paddingVertical: 14,
  };

  switch (props.variant) {
    case 'primary':
      pressableStyle.backgroundColor = colors.primary;
      pressableStyle.borderRadius = borderRadius.xLarge;
      break;
    case 'outline':
      pressableStyle.backgroundColor = 'transparent';
      pressableStyle.borderRadius = borderRadius.xLarge;
      pressableStyle.borderColor = colors.primary;
      pressableStyle.borderWidth = 1;
      break;
    case 'underline':
      break;
    default:
      pressableStyle.backgroundColor = colors.primary;
  }

  const textStyle: TextStyle = {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: fontSizes.base,
    textAlign: 'center',
  };
  switch (props.variant) {
    case 'primary':
      textStyle.color = colors.text;
      break;
    case 'outline':
      textStyle.color = colors.primary;
      break;
    case 'underline':
      textStyle.textDecorationLine = 'underline';
      textStyle.textDecorationColor = colors.primary;
      textStyle.textDecorationStyle = 'solid';
      textStyle.color = colors.text;
      textStyle.opacity = 0.7;
      break;
    default:
      textStyle.color = colors.text;
  }

  return (
    <Pressable
      {...props}
      style={{
        ...pressableStyle,
        ...style,
        opacity: disabled || isPressed || isLoading ? opacity.dimmed : 1,
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
              marginRight: spacing.xSmall,
            }}
          ></ActivityIndicator>
        )
      }
      {
        // Show an icon if provided
        props.icon && (
          <View
            style={{
              marginRight: 10,
            }}
          >
            {props.icon}
          </View>
        )
      }
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
};

export default StyledButton;
