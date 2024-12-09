import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { formatAmount, SupportedTokensReturnType } from '@raylac/shared';
import { View } from 'react-native';
import TokenLogo from '@/components/FastImage/TokenLogo';

interface SwapIOCardProps {
  token: SupportedTokensReturnType[number];
  amount: bigint;
  usdAmount: number;
}

const SwapIOCard = (props: SwapIOCardProps) => {
  const { token, amount, usdAmount } = props;

  const formattedAmount = formatAmount(amount.toString(), token.decimals);

  return (
    <View
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 32,
        borderColor: colors.border,
        rowGap: 12,
        width: 160,
        paddingVertical: 16,
      }}
    >
      <TokenLogo
        source={{ uri: token.logoURI }}
        style={{ width: 42, height: 42 }}
      />
      <View
        style={{ flexDirection: 'column', alignItems: 'center', rowGap: 6 }}
      >
        <StyledText>{`${formattedAmount} ${token.symbol}`}</StyledText>
        <StyledText
          style={{
            color: colors.subbedText,
          }}
        >{`$${usdAmount}`}</StyledText>
      </View>
    </View>
  );
};

export default SwapIOCard;
