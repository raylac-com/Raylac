import TokenBalanceListItem from '@/components/TokenBalanceListItem';
import useTokenBalances from '@/hooks/useTokenBalance';
import spacing from '@/lib/styles/spacing';
import { FlatList, View } from 'react-native';

const TokenBalances = () => {
  const { data: tokenBalances } = useTokenBalances();

  return (
    <View
      style={{
        marginTop: spacing.base,
        flexDirection: 'column',
      }}
    >
      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
        data={tokenBalances}
        renderItem={({ item }) => (
          <TokenBalanceListItem
            tokenId={item.tokenId}
            balance={BigInt(item.balance)}
          />
        )}
      />
    </View>
  );
};

export default TokenBalances;
