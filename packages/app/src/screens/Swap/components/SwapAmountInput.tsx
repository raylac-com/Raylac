import { TextInput, View } from 'react-native';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { Token } from '@raylac/shared';
import Feather from '@expo/vector-icons/Feather';
import StyledText from '@/components/StyledText/StyledText';
import Skeleton from '@/components/Skeleton/Skeleton';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import Toast from 'react-native-toast-message';

const SwapAmountInput = ({
  selectedToken,
  chainId,
  onSelectTokenPress,
  amount,
  setAmount,
  isLoadingAmount,
  canEnterAmount,
}: {
  selectedToken: Token | null;
  chainId: number | null;
  onSelectTokenPress: () => void;
  isLoadingAmount: boolean;
  amount: string;
  setAmount: (value: string) => void;
  canEnterAmount: boolean;
}) => {
  return (
    <View>
      <FeedbackPressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          columnGap: 8,
        }}
        disabled={!!selectedToken}
        onPress={onSelectTokenPress}
      >
        <FeedbackPressable onPress={onSelectTokenPress}>
          {selectedToken ? (
            <TokenLogoWithChain
              chainId={chainId}
              logoURI={selectedToken.logoURI}
              size={34}
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
        </FeedbackPressable>
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
            onChangeText={text => {
              if (canEnterAmount) {
                setAmount(text);
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Cannot set output amount',
                });
              }
            }}
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
        <FeedbackPressable
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
          <Feather name="chevron-down" size={24} color={colors.subbedText} />
        </FeedbackPressable>
      </FeedbackPressable>
    </View>
  );
};

export default SwapAmountInput;
