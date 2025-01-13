import { ScrollView, RefreshControl, View } from 'react-native';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import TokenBalanceItem from '@/components/TokenBalanceItem/TokenBalanceItem';
import StyledText from '@/components/StyledText/StyledText';
import { useEffect, useState } from 'react';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import useAccountUsdValue from '@/hooks/useAccountUsdValue';
import Skeleton from '@/components/Skeleton/Skeleton';
import TokenBalanceDetailsSheet from '@/components/TokenBalanceDetailsSheet/TokenBalanceDetailsSheet';
import { groupTokenBalancesByToken, Token } from '@raylac/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserAddresses from '@/hooks/useUserAddresses';
import Fav from '@/components/Fav/Fav';
import TopMenuBar from './components/TopMenuBar/TopMenuBar';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import Feather from '@expo/vector-icons/Feather';
import { getUserAddresses } from '@/lib/key';
import { useTranslation } from 'react-i18next';

const AddAddressButton = () => {
  const { t } = useTranslation('common');
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
          height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      }}
      onPress={() =>
        navigation.navigate('Tabs', {
          screen: 'Addresses',
        })
      }
    >
      <Feather name="plus" size={20} color={colors.text} />
      <StyledText style={{ color: colors.text, fontWeight: 'bold' }}>
        {t('addAddress')}
      </StyledText>
    </FeedbackPressable>
  );
};

const HomeScreen = () => {
  const { t } = useTranslation('Home');
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
      refetchOnReconnect: true,
    }
  );

  // Prefetch history
  const { data: _history } = trpc.getHistory.useQuery(
    {
      addresses: userAddresses?.map(address => address.address) ?? [],
    },
    {
      enabled: !!userAddresses,
      throwOnError: false,
    }
  );

  const { data: accountUsdValue, isLoading: isLoadingAccountUsdValue } =
    useAccountUsdValue();

  ///
  /// Effects
  ///

  useEffect(() => {
    const init = async () => {
      const addresses = await getUserAddresses();

      if (addresses.length === 0) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Start' }],
        });
      }

      const nonBackupVerifiedAddress = addresses.find(a => !a.isBackupVerified);

      // If there is no non-backup verified address, we need to confirm the backup phrase
      if (nonBackupVerifiedAddress) {
        navigation.navigate('ConfirmBackupPhrase', {
          genesisAddress: nonBackupVerifiedAddress.address,
        });
      }
    };

    // Only run after the cache is reset and we have a definitive userAccount value
    init();
  }, []);

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
              t('accountBalance', { balance: accountUsdValue })
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
          {groupedTokenBalances.length === 0 && tokenBalances !== undefined && (
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
                {t('noTokens')}
              </StyledText>
              <AddAddressButton />
            </View>
          )}
          {groupedTokenBalances.map((item, index) => (
            <FeedbackPressable
              key={index}
              onPress={() => {
                setShowTokenBalanceDetailsSheet(item.token);
              }}
            >
              <TokenBalanceItem
                balance={item.totalBalance}
                symbol={item.token.symbol}
                name={item.token.name}
                logoUrl={item.token.logoURI}
              />
            </FeedbackPressable>
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
