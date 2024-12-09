import { Pressable, TextInput, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SupportedTokensReturnType } from '@raylac/shared';
import StyledText from '@/components/StyledText/StyledText';
import Skeleton from '@/components/Skeleton/Skeleton';

const SwapAmountInput = ({
  selectedToken,
  onSelectTokenPress,
  amount,
  setAmount,
  isLoadingAmount,
}: {
  selectedToken: SupportedTokensReturnType[number] | null;
  onSelectTokenPress: () => void;
  isLoadingAmount: boolean;
  amount: string;
  setAmount: (value: string) => void;
}) => {
  return (
    <View>
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          columnGap: 8,
        }}
        disabled={!!selectedToken}
        onPress={onSelectTokenPress}
      >
        {selectedToken ? (
          <FastImage
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
        {isLoadingAmount ? (
          <Skeleton
            style={{
              width: '100%',
              flexShrink: 1,
              height: 30,
            }}
          />
        ) : selectedToken ? (
          <TextInput
            keyboardType="numeric"
            value={selectedToken ? amount : ''}
            onChangeText={setAmount}
            placeholder={'0.00'}
            style={{
              fontSize: fontSizes.twoXLarge,
              flexShrink: 1,
              width: '100%',
            }}
            numberOfLines={1}
          />
        ) : (
          <View style={{ flexShrink: 1, width: '100%' }}>
            <StyledText
              style={{
                color: colors.subbedText,
                fontSize: fontSizes.base,
              }}
            >
              {`Select token`}
            </StyledText>
          </View>
        )}
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={onSelectTokenPress}
        >
          <StyledText
            style={{
              fontSize: fontSizes.twoXLarge,
              color: colors.subbedText,
            }}
          >
            {selectedToken ? selectedToken.symbol : ''}
          </StyledText>
          <Ionicons
            name="chevron-expand-outline"
            size={24}
            color={colors.subbedText}
          />
        </Pressable>
      </Pressable>
    </View>
  );
};

export default SwapAmountInput;
