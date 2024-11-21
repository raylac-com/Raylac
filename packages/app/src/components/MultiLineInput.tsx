import colors from '@/lib/styles/colors';
import spacing from '@/lib/styles/spacing';
import borderRadius from '@/lib/styles/borderRadius';
import { TextInput, TextInputProps } from 'react-native';
import fontSizes from '@/lib/styles/fontSizes';

type MultiLineInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
} & TextInputProps;

const MultiLineInput = (props: MultiLineInputProps) => {
  return (
    <TextInput
      {...props}
      style={{
        fontSize: fontSizes.base,
        height: 240,
        color: colors.text,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.gray,
        borderRadius: borderRadius.small,
        padding: spacing.small,
      }}
      placeholderTextColor={colors.gray}
      multiline={true}
    />
  );
};

export default MultiLineInput;
