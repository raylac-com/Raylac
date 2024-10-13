import { Text, View, ScrollView, RefreshControl, Image } from 'react-native';
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
import useTokenBalances from '@/hooks/useTokenBalance';
import { getTransferType } from '@/lib/utils';

interface TokenBalanceItemProps {
  formattedBalance: string;
  formattedUsdBalance: string;
  tokenId: string;
}

const TokenBalanceItem = (props: TokenBalanceItemProps) => {
  const { tokenId, formattedBalance, formattedUsdBalance } = props;

  const tokenMetadata = supportedTokens.find(
    token => token.tokenId === tokenId
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        borderColor: theme.gray,
      }}
    >
      <Image
        source={{ uri: tokenMetadata.logoURI }}
        style={{
          width: 24,
          height: 24,
        }}
      />
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          rowGap: 4,
        }}
      >
        <Text
          style={{
            color: theme.text,
            fontSize: 20,
          }}
        >
          {`${formattedUsdBalance} USD`}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 16,
            opacity: 0.5,
          }}
        >
          {`${formattedBalance} ${tokenMetadata.symbol}`}
        </Text>
      </View>
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
  } = useTokenBalances();

  const {
    data: txHistory,
    refetch: refetchTxHistory,
    isRefetching: isRefetchingTxHistory,
  } = trpc.getTxHistory.useQuery(null, {
    enabled: isSignedIn,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    throwOnError: false,
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

  const totalUsdBalance = tokenBalances
    ? tokenBalances.reduce((acc, { formattedUsdBalance }) => {
        const balance = parseFloat(formattedUsdBalance);

        // Round to 2 decimal places
        return Math.round((acc + balance) * 100) / 100;
      }, 0)
    : null;

  if (!isSignedIn || !signedInUser) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          rowGap: 24,
          paddingHorizontal: 16,
        }}
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
              fontWeight: 500,
            }}
          >
            {totalUsdBalance} USD
          </Text>
        </View>
        {/* Action menus (Deposit, Send, Receive) */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            columnGap: 40,
          }}
        >
          <MenuItem
            icon={<AntDesign name="plus" size={24} color={theme.background} />}
            title={t('deposit')}
            onPress={() => {
              navigation.navigate('Deposit');
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
              navigation.navigate('SelectRecipient');
            }}
          />
        </View>
        {/* Token list */}
        <ScrollView
          horizontal
          style={{
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
          {tokenBalances?.map(
            ({ tokenId, formattedBalance, formattedUsdBalance }, i) => {
              return (
                <TokenBalanceItem
                  key={i}
                  formattedBalance={formattedBalance}
                  formattedUsdBalance={formattedUsdBalance}
                  tokenId={tokenId}
                />
              );
            }
          )}
          {tokenBalances?.length > 3 && (
            <AntDesign name="arrowright" size={24} color={theme.gray} />
          )}
        </ScrollView>
        {/* Transfer history */}
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
          }}
        >
          {txHistory?.map((transfer, i) => (
            <TransferHistoryListItem
              key={i}
              transfer={transfer}
              type={getTransferType(transfer, signedInUser.id)}
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
    </View>
  );
};

export default HomeScreen;
