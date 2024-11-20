import colors from '@/lib/styles/colors';
import spacing from '@/lib/styles/spacing';
import borderRadius from '@/lib/styles/borderRadius';
import { TextInput } from 'react-native';
import fontSizes from '@/lib/styles/fontSizes';

interface MultiLineInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
}

const MultiLineInput = ({
  placeholder,
  value,
  onChangeText,
  editable,
}: MultiLineInputProps) => {
  return (
    <TextInput
      editable={editable}
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
      multiline={true}
      placeholder={placeholder}
      placeholderTextColor={colors.gray}
      value={value}
      onChangeText={onChangeText}
    />
  );
};

export default MultiLineInput;
