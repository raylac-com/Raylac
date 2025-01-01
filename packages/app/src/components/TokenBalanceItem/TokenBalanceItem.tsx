import colors from '@/lib/styles/colors';
import { Balance } from '@raylac/shared';
import { View } from 'react-native';
import StyledText from '../StyledText/StyledText';
import TokenLogo from '../FastImage/TokenLogo';

const shortenName = (name: string) => {
  if (name.length > 20) {
    return name.slice(0, 20) + '...';
  }
  return name;
};

const TokenBalanceItem = (props: {
  name: string;
  symbol: string;
  balance: Balance;
  tokenDecimals: number;
  logoUrl: string;
}) => {
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
            <StyledText
              style={{ fontWeight: 'bold' }}
            >{`$${props.balance.usdValueFormatted}`}</StyledText>
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
