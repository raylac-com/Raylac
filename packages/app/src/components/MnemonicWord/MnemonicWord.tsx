import colors from '@/lib/styles/colors';
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
        backgroundColor: bgColor || colors.text,
      }}
    >
      <Text
        style={{
          color: colors.background,
        }}
      >
        {index} {word}
      </Text>
    </View>
  );
};

export default MnemonicWord;
