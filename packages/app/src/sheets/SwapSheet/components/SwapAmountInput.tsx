import { Image, Pressable, Text, TextInput, View } from 'react-native';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SupportedTokensReturnType } from '@raylac/shared';
import { SheetManager } from 'react-native-actions-sheet';

const SwapAmountInput = ({
  selectedToken,
  setSelectedToken,
  amount,
  setAmount,
}: {
  selectedToken: SupportedTokensReturnType[number] | null;
  setSelectedToken: (token: SupportedTokensReturnType[number]) => void;
  amount: string;
  setAmount: (value: string) => void;
}) => {
  const onSelectTokenPress = async () => {
    const returnValue = await SheetManager.show('search-token-sheet');
    if (returnValue) {
      setSelectedToken(returnValue);
    }
  };

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      disabled={!!selectedToken}
      onPress={onSelectTokenPress}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
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
        {selectedToken ? (
          <TextInput
            keyboardType="numeric"
            value={selectedToken ? amount : ''}
            onChangeText={setAmount}
            placeholder={'0.00'}
            style={{
              fontSize: fontSizes.twoXLarge,
              width: '50%',
            }}
          />
        ) : (
          <Text style={{ color: colors.subbedText, fontSize: fontSizes.base }}>
            {`Select token`}
          </Text>
        )}
      </View>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center' }}
        onPress={onSelectTokenPress}
      >
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
      </Pressable>
    </Pressable>
  );
};

export default SwapAmountInput;
