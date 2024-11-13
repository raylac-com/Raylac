import colors from '@/lib/styles/colors';
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
        backgroundColor: colors.text,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        columnGap: 8,
        ...containerStyle,
      }}
    >
      <TextInput
        {...props}
        style={{
          color: colors.background,
          width: '100%',
          height: 32,
          ...inputStyle,
        }}
      ></TextInput>
      {postfix ? (
        <Text
          style={{
            opacity: 0.6,
            color: colors.text,
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
