import { theme } from '@/lib/theme';
import { Text, View } from 'react-native';

interface MnemonicWordProps {
  word: string;
  index?: number;
  bgColor?: string;
}

const MnemonicWord = (props: MnemonicWordProps) => {
  const { word, index, bgColor } = props;
  return (
    <View
      style={{
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: bgColor || theme.text,
      }}
    >
      <Text
        style={{
          color: theme.background,
        }}
      >
        {index} {word}
      </Text>
    </View>
  );
};

export default MnemonicWord;
