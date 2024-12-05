import { ScrollView, RefreshControl } from 'react-native';
import colors from '@/lib/styles/colors';
import useUserAddress from '@/hooks/useUserAddress';
import { trpc } from '@/lib/trpc';
import { TokenBalanceCard } from '@/components/TokenBalnaceCard';
import { hexToBigInt } from 'viem';
import StyledText from '@/components/StyledText/StyledText';

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
        rowGap: 24,
        paddingVertical: 32,
        paddingHorizontal: 16,
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
      <StyledText style={{ fontSize: 36, color: colors.text }}>
        {`$${accountUsdValue?.toFixed(2)}`}
      </StyledText>
      {tokenBalances
        ?.slice(0, 5)
        .map((tokenBalance, index) => (
          <TokenBalanceCard
            key={index}
            balance={hexToBigInt(tokenBalance.balance)}
            tokenDecimals={tokenBalance.decimals}
            symbol={tokenBalance.symbol}
            name={tokenBalance.name}
            usdValue={tokenBalance.usdValue}
            logoUrl={tokenBalance.logoUrl}
          />
        ))}
    </ScrollView>
  );
};

export default HomeScreen;
