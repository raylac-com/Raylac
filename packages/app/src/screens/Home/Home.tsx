import { ScrollView, RefreshControl, View, Pressable } from 'react-native';
import colors from '@/lib/styles/colors';
import useUserAccount from '@/hooks/useUserAccount';
import { trpc } from '@/lib/trpc';
import TokenBalanceCard from '@/components/TokenBalnaceCard';
import { hexToBigInt, zeroAddress } from 'viem';
import StyledText from '@/components/StyledText/StyledText';
import { useEffect, useState } from 'react';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import MenuItem from './components/MenuItem/MenuItem';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { copyToClipboard } from '@/lib/utils';
import Toast from 'react-native-toast-message';
import useAccountUsdValue from '@/hooks/useAccountUsdValue';
import Skeleton from '@/components/Skeleton/Skeleton';
import TokenBalanceDetailsSheet from '@/components/TokenBalanceDetailsSheet/TokenBalanceDetailsSheet';
import { TokenBalancesReturnType } from '@raylac/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const navigation = useTypedNavigation();
  const insets = useSafeAreaInsets();

  ///
  /// Local state
  ///
  const [isRefetching, setIsRefetching] = useState(false);
  const [showTokenBalanceDetailsSheet, setShowTokenBalanceDetailsSheet] =
    useState<TokenBalancesReturnType[number] | null>(null);

  ///
  /// Queries
  ///

  const { data: userAccount, isLoading: isLoadingAddress } = useUserAccount();

  const { data: tokenBalances, refetch } = trpc.getTokenBalances.useQuery(
    {
      address: userAccount?.address ?? zeroAddress,
    },
    {
      enabled: !!userAccount,
    }
  );

  const { data: accountUsdValue, isLoading: isLoadingAccountUsdValue } =
    useAccountUsdValue();

  ///
  /// Effects
  ///

  useEffect(() => {
    if (userAccount === null && !isLoadingAddress) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Start' }],
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('userAccount', userAccount);
    }
  }, [userAccount, isLoadingAddress]);

  ///
  /// Handlers
  ///

  const onDepositPress = () => {
    if (userAccount) {
      copyToClipboard(userAccount.address);
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
    navigation.navigate('Tabs', {
      screen: 'Swap',
    });
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
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
          {isLoadingAccountUsdValue ? (
            <Skeleton style={{ width: 100, height: 24 }} />
          ) : (
            `$${accountUsdValue}`
          )}
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
        {tokenBalances?.map((tokenBalance, index) => (
          <Pressable
            key={index}
            onPress={() => setShowTokenBalanceDetailsSheet(tokenBalance)}
          >
            <TokenBalanceCard
              balance={hexToBigInt(tokenBalance.balance)}
              tokenDecimals={tokenBalance.token.decimals}
              symbol={tokenBalance.token.symbol}
              name={tokenBalance.token.name}
              usdValue={tokenBalance.usdValue}
              logoUrl={tokenBalance.token.logoURI}
            />
          </Pressable>
        ))}
      </ScrollView>
      {showTokenBalanceDetailsSheet && (
        <TokenBalanceDetailsSheet
          tokenBalance={showTokenBalanceDetailsSheet}
          onClose={() => {
            setShowTokenBalanceDetailsSheet(null);
          }}
        />
      )}
    </View>
  );
};

export default HomeScreen;
