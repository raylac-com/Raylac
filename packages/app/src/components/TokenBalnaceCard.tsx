import borderRadius from '@/lib/styles/borderRadius';
import colors from '@/lib/styles/colors';
import spacing from '@/lib/styles/spacing';
import { Image, Text, View } from 'react-native';

export const TokenBalanceCard = (props: {
  name: string;
  symbol: string;
  usdValue: string;
  logoUrl: string;
}) => {
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
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <Image
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
          <Text>{props.name}</Text>
          <Text style={{ color: colors.border }}>{props.symbol}</Text>
        </View>
      </View>
      <Text style={{ fontWeight: 'bold' }}>{`$${props.usdValue}`}</Text>
    </View>
  );
};
