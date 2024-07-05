import { theme } from '@/lib/theme';
import { Text, TextInput, TextInputProps, View, ViewProps } from 'react-native';

type StyledTextInputProps = {
  postfix?: string;
  inputStyle?: TextInputProps['style'];
  containerStyle?: ViewProps['style'];
} & TextInputProps;

const StyledTextInput = (props: StyledTextInputProps) => {
  const { postfix } = props;
  const containerStyle = (
    props.containerStyle ? props.containerStyle : {}
  ) as object;
  const inputStyle = (props.inputStyle ? props.inputStyle : {}) as object;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        columnGap: 8,
        ...containerStyle,
      }}
    >
      <TextInput
        {...props}
        style={{
          color: theme.background,
          width: 120,
          ...inputStyle,
        }}
      ></TextInput>
      {postfix ? (
        <Text
          style={{
            opacity: 0.6,
            color: theme.background,
            marginRight: -8,
          }}
        >
          {postfix}
        </Text>
      ) : null}
    </View>
  );
};

export default StyledTextInput;
