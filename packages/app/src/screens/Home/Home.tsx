import { ScrollView, RefreshControl, View, Pressable } from 'react-native';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import TokenBalanceItem from '@/components/TokenBalanceItem/TokenBalanceItem';
import StyledText from '@/components/StyledText/StyledText';
import { useEffect, useState } from 'react';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { hapticOptions } from '@/lib/utils';
import useAccountUsdValue from '@/hooks/useAccountUsdValue';
import Skeleton from '@/components/Skeleton/Skeleton';
import TokenBalanceDetailsSheet from '@/components/TokenBalanceDetailsSheet/TokenBalanceDetailsSheet';
import { groupTokenBalancesByToken, Token } from '@raylac/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserAddresses from '@/hooks/useUserAddresses';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Fav from '@/components/Fav/Fav';
import TopMenuBar from './components/TopMenuBar/TopMenuBar';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import AntDesign from '@expo/vector-icons/AntDesign';

const AddAddressButton = () => {
  const navigation = useTypedNavigation();
  return (
    <FeedbackPressable
      style={{
        borderRadius: 32,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
        shadowColor: colors.text,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
      onPress={() => navigation.navigate('Addresses')}
    >
      <AntDesign name="plus" size={20} color={colors.text} />
      <StyledText style={{ color: colors.text, fontWeight: 'bold' }}>
        {'Add address'}
      </StyledText>
    </FeedbackPressable>
  );
};

const HomeScreen = () => {
  const navigation = useTypedNavigation();
  const insets = useSafeAreaInsets();

  ///
  /// Local state
  ///
  const [isRefetching, setIsRefetching] = useState(false);
  const [showTokenBalanceDetailsSheet, setShowTokenBalanceDetailsSheet] =
    useState<Token | null>(null);

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
      refetchOnWindowFocus: true,
    }
  );

  // Prefetch history
  const { data: _history } = trpc.getHistory.useQuery(
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

  const groupedTokenBalances = groupTokenBalancesByToken({
    tokenBalances: tokenBalances ?? [],
  });

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        position: 'relative',
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
        <TopMenuBar />
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
            flexDirection: 'column',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            borderBottomWidth: 0,
            padding: 16,
          }}
        >
          {groupedTokenBalances.length === 0 && (
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                rowGap: 48,
              }}
            >
              <StyledText style={{ marginTop: 16, color: colors.subbedText }}>
                {`No tokens found`}
              </StyledText>
              <AddAddressButton />
            </View>
          )}
          {groupedTokenBalances.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => {
                ReactNativeHapticFeedback.trigger(
                  'impactMedium',
                  hapticOptions
                );
                setShowTokenBalanceDetailsSheet(item.token);
              }}
            >
              <TokenBalanceItem
                balance={item.totalBalance}
                symbol={item.token.symbol}
                name={item.token.name}
                logoUrl={item.token.logoURI}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Fav />
      {showTokenBalanceDetailsSheet && (
        <TokenBalanceDetailsSheet
          token={showTokenBalanceDetailsSheet}
          onClose={() => {
            setShowTokenBalanceDetailsSheet(null);
          }}
        />
      )}
    </View>
  );
};

export default HomeScreen;
