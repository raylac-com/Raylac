import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import borderRadius from '@/lib/styles/borderRadius';
import { TextInput, TextInputProps } from 'react-native';

type StyledTextInputProps = TextInputProps;

const StyledTextInput = (props: StyledTextInputProps) => {
  return (
    <TextInput
      {...props}
      style={{
        fontSize: fontSizes.base,
        color: colors.text,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.gray,
        borderRadius: borderRadius.small,
        padding: spacing.small,
      }}
      placeholderTextColor={colors.gray}
    ></TextInput>
  );
};

export default StyledTextInput;
