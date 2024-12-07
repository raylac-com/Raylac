import { ScrollView, RefreshControl, View } from 'react-native';
import colors from '@/lib/styles/colors';
import useUserAddress from '@/hooks/useUserAddress';
import { trpc } from '@/lib/trpc';
import { TokenBalanceCard } from '@/components/TokenBalnaceCard';
import { hexToBigInt } from 'viem';
import StyledText from '@/components/StyledText/StyledText';
import { useEffect, useState } from 'react';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import MenuItem from './components/MenuItem/MenuItem';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { copyToClipboard } from '@/lib/utils';
import Toast from 'react-native-toast-message';
import { SheetManager } from 'react-native-actions-sheet';

const HomeScreen = () => {
  const navigation = useTypedNavigation();

  ///
  /// Local state
  ///
  const [isRefetching, setIsRefetching] = useState(false);

  ///
  /// Queries
  ///

  const { data: userAddress, isLoading: isLoadingAddress } = useUserAddress();

  const { data: tokenBalances, refetch } = trpc.getTokenBalances.useQuery(
    {
      address: userAddress!,
    },
    {
      enabled: !!userAddress,
    }
  );

  ///
  /// Effects
  ///

  useEffect(() => {
    if (userAddress === null && !isLoadingAddress) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Start' }],
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('userAddress', userAddress);
    }
  }, [userAddress, isLoadingAddress]);

  ///
  /// Handlers
  ///

  const onDepositPress = () => {
    if (userAddress) {
      copyToClipboard(userAddress);
      Toast.show({
        type: 'success',
        text1: 'Address copied to clipboard',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Address not loaded',
      });
    }
  };

  const onSwapPress = () => {
    SheetManager.show('swap-sheet');
  };

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
          refreshing={isRefetching}
          onRefresh={async () => {
            setIsRefetching(true);
            await refetch();
            setIsRefetching(false);
          }}
        />
      }
      testID="home"
    >
      <StyledText style={{ fontSize: 36, color: colors.text }}>
        {`$${accountUsdValue?.toFixed(2)}`}
      </StyledText>
      <View style={{ flexDirection: 'row', columnGap: 20 }}>
        <MenuItem
          icon={<AntDesign name="plus" size={24} color={colors.background} />}
          title="Deposit"
          testID="deposit"
          onPress={onDepositPress}
        />
        <MenuItem
          icon={
            <Ionicons
              name="swap-horizontal"
              size={24}
              color={colors.background}
            />
          }
          title="Swap"
          testID="swap"
          onPress={onSwapPress}
        />
      </View>
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
