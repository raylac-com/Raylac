import colors from '@/lib/styles/colors';
import { formatAmount, formatUsdValue } from '@raylac/shared';
import { View } from 'react-native';
import StyledText from './StyledText/StyledText';
import TokenLogo from './FastImage/TokenLogo';
import BigNumber from 'bignumber.js';

const shortenName = (name: string) => {
  if (name.length > 20) {
    return name.slice(0, 20) + '...';
  }
  return name;
};

const TokenBalanceCard = (props: {
  name: string;
  symbol: string;
  balance: bigint;
  tokenDecimals: number;
  usdValue: string;
  logoUrl: string;
}) => {
  const formattedBalance = formatAmount(
    props.balance.toString(),
    props.tokenDecimals
  );

  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderColor: colors.border,
        borderWidth: 1,
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
            >{`$${formatUsdValue(new BigNumber(props.usdValue))}`}</StyledText>
          </View>
          <StyledText style={{ color: colors.border }}>
            {formattedBalance} {props.symbol}
          </StyledText>
        </View>
      </View>
    </View>
  );
};

export default TokenBalanceCard;
