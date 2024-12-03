import { Image, Text, TextInput, View } from 'react-native';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SupportedToken } from '@/types';

const TokenSelector = ({
  token,
  amount,
  setAmount,
}: {
  token: SupportedToken;
  amount: string;
  setAmount: (value: string) => void;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {token && (
        <Image
          source={{ uri: token.metadata?.logoURI }}
          style={{ width: 34, height: 34 }}
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={{
            fontSize: fontSizes.twoXLarge,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{ fontSize: fontSizes.twoXLarge, color: colors.subbedText }}
        >
          {token?.symbol}
        </Text>
        <Ionicons name="chevron-expand" size={24} color={colors.subbedText} />
      </View>
    </View>
  );
};

export default TokenSelector;
