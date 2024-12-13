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
    const init = async () => {
      if (userAccount === null && !isLoadingAddress) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Start' }],
        });
      }
    };

    // Only run after the cache is reset and we have a definitive userAccount value
    init();
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

  const onSendPress = () => {
    navigation.navigate('SelectRecipient');
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
          <MenuItem
            icon={
              <AntDesign name="arrowup" size={24} color={colors.background} />
            }
            title="Send"
            testID="send"
            onPress={onSendPress}
          />
        </View>
        <View
          style={{
            flexDirection: 'column',
            rowGap: 8,
          }}
        >
          {tokenBalances?.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => setShowTokenBalanceDetailsSheet(item)}
            >
              <TokenBalanceCard
                balance={hexToBigInt(item.balance)}
                tokenDecimals={item.token.decimals}
                symbol={item.token.symbol}
                name={item.token.name}
                usdValue={item.usdValue}
                logoUrl={item.token.logoURI}
              />
            </Pressable>
          ))}
        </View>
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
