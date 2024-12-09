import borderRadius from '@/lib/styles/borderRadius';
import colors from '@/lib/styles/colors';
import spacing from '@/lib/styles/spacing';
import { formatAmount } from '@raylac/shared';
import { View } from 'react-native';
import StyledText from './StyledText/StyledText';
import FastImage from 'react-native-fast-image';

export const TokenBalanceCard = (props: {
  name: string;
  symbol: string;
  balance: bigint;
  tokenDecimals: number;
  usdValue: number;
  logoUrl: string;
}) => {
  const formattedBalance = formatAmount(
    props.balance.toString(),
    props.tokenDecimals
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        padding: spacing.default,
        borderRadius: borderRadius.base,
        borderColor: colors.border,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: colors.border,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <FastImage
          source={{ uri: props.logoUrl }}
          style={{ width: 42, height: 42 }}
        />
        <View
          style={{
            flexDirection: 'column',
            justifyContent: 'space-between',
            rowGap: 4,
          }}
        >
          <StyledText>{props.name}</StyledText>
          <StyledText style={{ color: colors.border }}>
            {formattedBalance} {props.symbol}
          </StyledText>
        </View>
      </View>
      <StyledText
        style={{ fontWeight: 'bold' }}
      >{`$${props.usdValue.toFixed(2)}`}</StyledText>
    </View>
  );
};
