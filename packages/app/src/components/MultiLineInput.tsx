import { theme } from '@/lib/theme';
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
        color: theme.text,
        width: '100%',
        borderWidth: 1,
        borderColor: theme.gray,
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
