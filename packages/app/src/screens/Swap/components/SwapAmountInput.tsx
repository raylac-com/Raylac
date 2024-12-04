import { Image, Text, TextInput, View } from 'react-native';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SupportedTokensReturnType } from '@raylac/shared';

const SwapAmountInput = ({
  selectedToken,
  amount,
  setAmount,
}: {
  selectedToken: SupportedTokensReturnType[number] | null;
  amount: string;
  setAmount: (value: string) => void;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
      >
        {selectedToken ? (
          <Image
            source={{ uri: selectedToken.logoURI }}
            style={{ width: 34, height: 34 }}
          />
        ) : (
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 34,
              backgroundColor: '#D9D9D9',
            }}
          />
        )}
        <TextInput
          keyboardType="numeric"
          value={selectedToken ? amount : ''}
          onChangeText={setAmount}
          placeholder={selectedToken ? '0.00' : 'Select token'}
          style={{
            fontSize: selectedToken ? fontSizes.twoXLarge : fontSizes.base,
          }}
          placeholderTextColor={colors.subbedText}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: fontSizes.twoXLarge,
            color: colors.subbedText,
          }}
        >
          {selectedToken ? selectedToken.symbol : ''}
        </Text>
        <Ionicons
          name="chevron-expand-outline"
          size={24}
          color={colors.subbedText}
        />
      </View>
    </View>
  );
};

export default SwapAmountInput;
