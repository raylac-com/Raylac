import { ScrollView, RefreshControl, Text, FlatList } from 'react-native';
import spacing from '@/lib/styles/spacing';
import colors from '@/lib/styles/colors';
import useUserAddress from '@/hooks/useUserAddress';
import { trpc } from '@/lib/trpc';
import { TokenBalanceCard } from '@/components/TokenBalnaceCard';
import { MultiChainTokenBalance } from '@raylac/shared';

const HomeScreen = () => {
  const { data: userAddress } = useUserAddress();

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      address: userAddress,
    },
    {
      enabled: !!userAddress,
    }
  );

  const accountUsdValue = tokenBalances?.reduce((acc, tokenBalance) => {
    return acc + (tokenBalance.usdValue ?? 0);
  }, 0);

  return (
    <ScrollView
      contentContainerStyle={{
        rowGap: spacing.default,
        padding: spacing.default,
      }}
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          refreshing={false}
          onRefresh={() => {}}
        />
      }
      testID="home"
    >
      <Text>{accountUsdValue}</Text>
      <FlatList
        data={tokenBalances}
        renderItem={({ item }) => (
          <TokenBalanceCard {...(item as MultiChainTokenBalance)} />
        )}
      ></FlatList>
    </ScrollView>
  );
};

export default HomeScreen;
