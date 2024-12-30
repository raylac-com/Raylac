import { ScrollView, RefreshControl, View, Pressable } from 'react-native';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import TokenBalanceCard from '@/components/TokenBalnaceCard';
import { hexToBigInt } from 'viem';
import StyledText from '@/components/StyledText/StyledText';
import { useEffect, useState } from 'react';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import MenuItem from './components/MenuItem/MenuItem';
import AntDesign from '@expo/vector-icons/AntDesign';
// import { Ionicons } from '@expo/vector-icons';
import { copyToClipboard, hapticOptions } from '@/lib/utils';
import Toast from 'react-native-toast-message';
import useAccountUsdValue from '@/hooks/useAccountUsdValue';
import Skeleton from '@/components/Skeleton/Skeleton';
import TokenBalanceDetailsSheet from '@/components/TokenBalanceDetailsSheet/TokenBalanceDetailsSheet';
import { TokenBalancesReturnType } from '@raylac/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserAddresses from '@/hooks/useUserAddresses';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
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

  const { data: userAddresses } = useUserAddresses();

  const { data: tokenBalances, refetch } = trpc.getTokenBalances.useQuery(
    {
      addresses: userAddresses?.map(address => address.address) ?? [],
    },
    {
      enabled: !!userAddresses,
    }
  );

  const { data: accountUsdValue, isLoading: isLoadingAccountUsdValue } =
    useAccountUsdValue();

  ///
  /// Effects
  ///

  useEffect(() => {
    const init = async () => {
      if (userAddresses !== undefined && userAddresses.length === 0) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Start' }],
        });
      }
    };

    // Only run after the cache is reset and we have a definitive userAccount value
    init();
  }, [userAddresses]);

  ///
  /// Handlers
  ///

  const onDepositPress = () => {
    if (userAddresses) {
      copyToClipboard(userAddresses[0].address);
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

  const _onSwapPress = () => {
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
        <View
          style={{
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 184,
          }}
        >
          <StyledText
            style={{ fontSize: 36, fontWeight: 'bold', color: colors.text }}
          >
            {isLoadingAccountUsdValue ? (
              <Skeleton style={{ width: 100, height: 24 }} />
            ) : (
              `$${accountUsdValue}`
            )}
          </StyledText>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            columnGap: 20,
          }}
        >
          <MenuItem
            icon={<AntDesign name="plus" size={24} color={colors.text} />}
            title="Deposit"
            testID="deposit"
            onPress={onDepositPress}
          />
          {/**
             * 
          <MenuItem
            icon={
              <Ionicons name="swap-horizontal" size={24} color={colors.text} />
            }
            title="Swap"
            testID="swap"
            onPress={onSwapPress}
          />
           */}
          <MenuItem
            icon={<AntDesign name="arrowup" size={24} color={colors.text} />}
            title="Send"
            testID="send"
            onPress={onSendPress}
          />
        </View>
        <View
          style={{
            flexDirection: 'column',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            borderBottomWidth: 0,
            padding: 16,
          }}
        >
          {tokenBalances?.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => {
                ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
                setShowTokenBalanceDetailsSheet(item);
              }}
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
