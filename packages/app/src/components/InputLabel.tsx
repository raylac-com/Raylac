import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import opacity from '@/lib/styles/opacity';

import { Text } from 'react-native';

interface InputLabelProps {
  label: string;
}

const InputLabel = ({ label }: InputLabelProps) => {
  return (
    <Text
      style={{
        fontSize: fontSizes.base,
        color: colors.text,
        opacity: opacity.dimmed,
      }}
    >
      {label}
    </Text>
  );
};

export default InputLabel;
