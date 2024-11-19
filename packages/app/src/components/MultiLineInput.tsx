import colors from '@/lib/styles/colors';
import { TextInput } from 'react-native';

interface MultiLineInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

const MultiLineInput = ({
  placeholder,
  value,
  onChangeText,
}: MultiLineInputProps) => {
  return (
    <TextInput
      style={{
        fontSize: 16,
        height: 240,
        color: colors.text,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.gray,
        borderRadius: 8,
        padding: 16,
      }}
      multiline={true}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
    />
  );
};

export default MultiLineInput;
