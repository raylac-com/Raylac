import { Text, View, ScrollView, RefreshControl, Image } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { useCallback, useEffect } from 'react';
import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import { useTranslation } from 'react-i18next';
import StyledPressable from '@/components/StyledPressable';
import { supportedTokens } from '@raylac/shared';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTokenBalances from '@/hooks/useTokenBalance';
import { getTransferType } from '@/lib/utils';
import spacing from '@/lib/styles/spacing';
import fontSizes from '@/lib/styles/fontSizes';
import borderRadius from '@/lib/styles/borderRadius';
import opacity from '@/lib/styles/opacity';

interface TokenBalanceItemProps {
  formattedBalance: string;
  formattedUsdBalance: string;
  tokenId: string;
}

const TokenBalanceItem = (props: TokenBalanceItemProps) => {
  const { tokenId, formattedBalance, formattedUsdBalance } = props;
  const { t } = useTranslation('Home');

  const tokenMetadata = supportedTokens.find(
    token => token.tokenId === tokenId
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: spacing.small,
        borderRadius: borderRadius.base,
        borderWidth: 1,
        padding: spacing.small,
        borderColor: colors.gray,
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
          rowGap: spacing.xxSmall,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.base,
          }}
        >
          {t('fiatDenominatedBalance', {
            balance: formattedUsdBalance,
          })}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.base,
            opacity: opacity.dimmed,
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
  testID: string;
  onPress: () => void;
}

const MenuItem = (props: MenuItemProps) => {
  const { icon, title, onPress, testID } = props;

  return (
    <StyledPressable
      onPress={onPress}
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        rowGap: spacing.xSmall,
      }}
      testID={testID}
    >
      <View
        style={{
          width: 50,
          height: 50,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.text,
          borderRadius: borderRadius.rounded,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: fontSizes.base,
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </StyledPressable>
  );
};

const NUM_TRANSFERS_TO_FETCH = 7;

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
    data: transferHistory,
    refetch: refetchTransferHistory,
    isRefetching: isRefetchingTransferHistory,
  } = trpc.getTransferHistory.useQuery(
    {
      take: NUM_TRANSFERS_TO_FETCH,
      skip: 0,
    },
    {
      enabled: isSignedIn,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      throwOnError: false,
    }
  );

  const navigation = useTypedNavigation();

  const onRefresh = useCallback(() => {
    refetchBalances();
    refetchTransferHistory();
  }, [refetchBalances, refetchTransferHistory]);

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

  if (!isSignedIn || !signedInUser || totalUsdBalance === null) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={{
        rowGap: spacing.base,
        paddingHorizontal: spacing.small,
        paddingTop: spacing.small,
      }}
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          refreshing={isRefetchingBalance || isRefetchingTransferHistory}
          onRefresh={onRefresh}
        />
      }
    >
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.large,
            color: colors.text,
            fontWeight: 500,
          }}
        >
          {t('fiatDenominatedBalance', { balance: totalUsdBalance })}
        </Text>
      </View>
      {/* Action menus (Deposit, Send, Receive) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          columnGap: spacing.large,
        }}
      >
        <MenuItem
          icon={<AntDesign name="plus" size={24} color={colors.background} />}
          title={t('deposit')}
          onPress={() => {
            navigation.navigate('Deposit');
          }}
          testID="deposit"
        />
        <MenuItem
          icon={
            <AntDesign name="arrowdown" size={24} color={colors.background} />
          }
          title={t('receive')}
          onPress={() => {
            navigation.navigate('Receive');
          }}
          testID="receive"
        />
        <MenuItem
          icon={
            <AntDesign name="arrowup" size={24} color={colors.background} />
          }
          title={t('send')}
          onPress={() => {
            navigation.navigate('SelectRecipient');
          }}
          testID="send"
        />
      </View>
      {/* Token list */}
      <ScrollView
        horizontal
        style={{
          flexDirection: 'row',
          height: 80,
          paddingHorizontal: spacing.base,
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
          <AntDesign name="arrowright" size={24} color={colors.gray} />
        )}
      </ScrollView>
      {/* Transfer history */}
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
        }}
      >
        {transferHistory?.map((transfer, i) => (
          <TransferHistoryListItem
            key={i}
            transfer={transfer}
            type={getTransferType(transfer, signedInUser.id)}
          />
        ))}
        {transferHistory && transferHistory.length >= NUM_TRANSFERS_TO_FETCH ? (
          <Text
            style={{
              textAlign: 'right',
              marginVertical: spacing.base,
              marginRight: spacing.base,
              textDecorationLine: 'underline',
              color: colors.text,
            }}
            onPress={() => {
              navigation.navigate('TransferHistory');
            }}
          >
            {t('seeAll')}
          </Text>
        ) : null}
        {transferHistory?.length === 0 ? (
          <Text
            style={{
              textAlign: 'center',
              opacity: opacity.dimmed,
              color: colors.text,
            }}
          >
            {t('noTransfers')}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
