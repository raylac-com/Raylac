import colors from '@/lib/styles/colors';
import { TokenAmount } from '@raylac/shared';
import { getCurrencyFormattedValue } from '@/lib/utils';
import useSelectedCurrency from '@/hooks/useSelectedCurrency';
import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import TokenLogo from '../TokenLogo/TokenLogo';

const shortenName = (name: string) => {
  if (name.length > 20) {
    return name.slice(0, 20) + '...';
  }
  return name;
};

const TokenBalanceItem = (props: {
  name: string;
  symbol: string;
  balance: TokenAmount;
  logoUrl: string;
}) => {
  const { data: selectedCurrency } = useSelectedCurrency();
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        paddingVertical: 10,
        borderRadius: 16,
        columnGap: 8,
      }}
    >
      <TokenLogo
        source={{ uri: props.logoUrl }}
        style={{ width: 42, height: 42 }}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <StyledText>{shortenName(props.name)}</StyledText>
            <StyledText style={{ fontWeight: 'bold' }}>
              {getCurrencyFormattedValue(props.balance, selectedCurrency)}
            </StyledText>
          </View>
          <StyledText style={{ color: colors.border }}>
            {props.balance.formatted} {props.symbol}
          </StyledText>
        </View>
      </View>
    </View>
  );
};

export default TokenBalanceItem;
