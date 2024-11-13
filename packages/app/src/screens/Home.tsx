import {
  Text,
  View,
  ScrollView,
  RefreshControl,
  Animated,
  Image,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback, useEffect, useState } from 'react';
import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import { useTranslation } from 'react-i18next';
import StyledPressable from '@/components/StyledPressable';
import { supportedTokens } from '@raylac/shared';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTokenBalances from '@/hooks/useTokenBalance';
import { getTransferType } from '@/lib/utils';
import FontAwesome5 from '@expo/vector-icons/build/FontAwesome5';
import spacing from '@/lib/styles/spacing';
import borderRadius from '@/lib/styles/borderRadius';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
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
  color?: string;
}

const MenuItem = (props: MenuItemProps) => {
  const { icon, title, onPress, testID, color } = props;

  return (
    <StyledPressable
      onPress={onPress}
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        width: 90,
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
          backgroundColor: color ?? colors.text,
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
          color: color ?? colors.text,
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

  const [otherMenuItemsModalVisible, setOtherMenuItemsModalVisible] =
    useState(true);

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
      {/* Action menus (Deposit, Send, Receive) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
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
        <MenuItem
          icon={
            <AntDesign name="ellipsis1" size={24} color={colors.background} />
          }
          title={t('other')}
          onPress={() => {
            if (otherMenuItemsModalVisible) {
              setOtherMenuItemsModalVisible(false);
            } else {
              setOtherMenuItemsModalVisible(true);
            }
          }}
          testID="other"
        />
      </View>
      {/* Other menu items */}
      <Animated.View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          height: otherMenuItemsModalVisible ? 'auto' : 0,
          opacity: otherMenuItemsModalVisible ? 1 : 0,
          transform: [
            {
              translateY: otherMenuItemsModalVisible ? 0 : -20,
            },
          ],
        }}
      >
        <MenuItem
          icon={
            <FontAwesome5
              name="feather-alt"
              size={20}
              color={colors.background}
            />
          }
          title={t('askForAngel')}
          color={colors.angelPink}
          onPress={() => {
            navigation.navigate('AboutAngels');
          }}
          testID="askForAngel"
        />
      </Animated.View>
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
              marginTop: 20,
              marginRight: 20,
              marginBottom: 20,
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
              marginTop: 20,
              opacity: 0.5,
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
