import { theme } from '@/lib/theme';
import { Text, TextInput, TextInputProps, View } from 'react-native';

type StyledTextInputProps = {
  postfix?: string;
} & TextInputProps;

const StyledTextInput = (props: StyledTextInputProps) => {
  const { postfix } = props;
  const style = (props.style ? props.style : {}) as object;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
      }}
    >
      <TextInput
        {...props}
        style={{
          ...style,
          backgroundColor: theme.backgroundHover,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 4,
          marginVertical: 10,
        }}
      ></TextInput>
      {postfix ? (
        <Text
          style={{
            opacity: 0.6,
          }}
        >
          {postfix}
        </Text>
      ) : null}
    </View>
  );
};

export default StyledTextInput;
