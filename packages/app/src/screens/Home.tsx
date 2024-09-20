import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useCallback, useEffect } from 'react';
import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import { useTranslation } from 'react-i18next';
import StyledPressable from '@/components/StyledPressable';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import useSignedInUser from '@/hooks/useSignedInUser';
import { formatAmount, TransferHistoryQueryResult } from '@raylac/shared';

interface TokenBalanceItemProps {
  tokenSymbol: string;
  tokenLogo;
  balance: string;
}

const TokenBalanceItem = (props: TokenBalanceItemProps) => {
  const { tokenSymbol, tokenLogo, balance } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
      }}
    >
      <Image
        source={{ uri: tokenLogo }}
        style={{
          width: 24,
          height: 24,
        }}
      />
      <Text
        style={{
          color: theme.text,
          fontSize: 20,
        }}
      >
        {`${balance} ${tokenSymbol}`}
      </Text>
    </View>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

const MenuItem = (props: MenuItemProps) => {
  const { icon, title, onPress } = props;

  return (
    <StyledPressable
      onPress={onPress}
      style={{
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.text,
          padding: 12,
          borderRadius: 100,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 16,
          marginTop: 8,
          color: theme.text,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </StyledPressable>
  );
};

const NUM_TRANSFERS_TO_SHOW = 5;

const HomeScreen = () => {
  const { t } = useTranslation('Home');
  const { data: isSignedIn } = useIsSignedIn();
  const { data: signedInUser } = useSignedInUser();

  const {
    data: tokenBalances,
    refetch: refetchBalances,
    isRefetching: isRefetchingBalance,
  } = trpc.getTokenBalances.useQuery(null, {
    enabled: isSignedIn,
    throwOnError: false, // Don't throw on error for this particular query in all environments
    refetchOnWindowFocus: true,
  });

  const {
    data: txHistory,
    refetch: refetchTxHistory,
    isRefetching: isRefetchingTxHistory,
  } = trpc.getTxHistory.useQuery(null, {
    enabled: isSignedIn,
    throwOnError: false, // Don't throw on error for this particular query in all environments
    refetchOnWindowFocus: true,
  });

  const navigation = useTypedNavigation();

  const onRefresh = useCallback(() => {
    refetchBalances();
    refetchTxHistory();
  }, [refetchBalances, refetchTxHistory]);

  useEffect(() => {
    if (isSignedIn === false) {
      navigation.navigate('Start');
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor={theme.primary}
            refreshing={isRefetchingBalance || isRefetchingTxHistory}
            onRefresh={onRefresh}
          />
        }
      >
        <View
          style={{
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              color: theme.text,
            }}
          >
            0 USD
          </Text>
        </View>
        {/* Action menus (Deposit, Send, Receive) */}
        <View
          style={{
            marginTop: 24,
            flexDirection: 'row',
            justifyContent: 'center',
            columnGap: 30,
          }}
        >
          <MenuItem
            icon={<AntDesign name="plus" size={24} color={theme.background} />}
            title={t('deposit')}
            onPress={() => {
              navigation.navigate('ConfirmDeposit');
            }}
          />
          <MenuItem
            icon={
              <AntDesign name="arrowdown" size={24} color={theme.background} />
            }
            title={t('receive')}
            onPress={() => {
              navigation.navigate('Receive');
            }}
          />
          <MenuItem
            icon={
              <AntDesign name="arrowup" size={24} color={theme.background} />
            }
            title={t('send')}
            onPress={() => {
              navigation.navigate('SelectSend');
            }}
          />
        </View>
        {/* Token list */}
        <ScrollView
          horizontal
          style={{
            marginTop: 12,
            flexDirection: 'row',
            height: 80,
            paddingHorizontal: 20,
          }}
          contentContainerStyle={{
            columnGap: 16,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {tokenBalances?.map(({ tokenId, balance }, i) => {
            const tokenMetadata = supportedTokens.find(
              token => token.tokenId === tokenId
            );
            return (
              <TokenBalanceItem
                key={i}
                balance={formatAmount(
                  balance.toString(),
                  tokenMetadata.decimals
                )}
                tokenSymbol={tokenMetadata.symbol}
                tokenLogo={tokenMetadata.logoURI}
              />
            );
          })}
          {tokenBalances?.length > 3 && (
            <AntDesign name="arrowright" size={24} color={theme.gray} />
          )}
        </ScrollView>
        {/* Transfer history */}
        <View
          style={{
            marginTop: 40,
            flex: 1,
            flexDirection: 'column',
          }}
        >
          {txHistory?.map((tx, i) => (
            <TransferHistoryListItem
              key={i}
              tx={tx as TransferHistoryQueryResult}
              type={
                tx.fromUserId === signedInUser?.id ? 'outgoing' : 'incoming'
              }
            />
          ))}
          {txHistory && txHistory.length > NUM_TRANSFERS_TO_SHOW ? (
            <Text
              style={{
                textAlign: 'right',
                marginTop: 20,
                marginRight: 20,
                marginBottom: 20,
                textDecorationLine: 'underline',
                color: theme.text,
              }}
              onPress={() => {
                navigation.navigate('TransferHistory');
              }}
            >
              {t('seeAll')}
            </Text>
          ) : null}
          {txHistory?.length === 0 ? (
            <Text
              style={{
                textAlign: 'center',
                marginTop: 20,
                opacity: 0.5,
                color: theme.text,
              }}
            >
              {t('noTransfers')}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
