import { Text, TextProps } from 'react-native';

const StyledText = ({ children, ...props }: TextProps) => {
  return (
    <Text
      style={{
        fontFamily:
          // @ts-ignore
          props.style?.fontWeight === 'bold' ? 'Lato-Bold' : 'Lato-Regular',
      }}
      {...props}
    >
      {children}
    </Text>
  );
};

export default StyledText;
