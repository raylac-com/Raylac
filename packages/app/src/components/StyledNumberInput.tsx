import { theme } from '@/lib/theme';
import { Text, TextInput, TextInputProps, View, ViewProps } from 'react-native';

type StyledNumberInputProps = {
  postfix?: string;
  inputStyle?: TextInputProps['style'];
  containerStyle?: ViewProps['style'];
} & TextInputProps;

const StyledNumberInput = (props: StyledNumberInputProps) => {
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
        backgroundColor: theme.background,
        paddingVertical: 12,
        borderRadius: 10,
        columnGap: 8,
        borderWidth: 1,
        borderColor: theme.gray,
        ...containerStyle,
      }}
    >
      <TextInput
        {...props}
        style={{
          color: theme.text,
          width: 120,
          fontSize: 30,
          backgroundColor: theme.background,
          borderColor: theme.background,
          ...inputStyle,
        }}
        keyboardType="numeric"
      ></TextInput>
      {postfix ? (
        <Text
          style={{
            opacity: 0.6,
            color: theme.text,
            marginRight: -8,
            fontSize: 18,
          }}
        >
          {postfix}
        </Text>
      ) : null}
    </View>
  );
};

export default StyledNumberInput;
