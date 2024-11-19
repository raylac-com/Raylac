import {
  Text,
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useCallback, useEffect, useState } from 'react';
import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import { useTranslation } from 'react-i18next';
import StyledPressable from '@/components/StyledPressable';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTokenBalances from '@/hooks/useTokenBalance';
import FontAwesome5 from '@expo/vector-icons/build/FontAwesome5';
import spacing from '@/lib/styles/spacing';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import TokenBalanceListItem from '@/components/TokenBalanceListItem';
import FastAvatar from '@/components/FastAvatar';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

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

const HomeHeader = () => {
  const { data: signedInUser } = useSignedInUser();
  const navigation = useTypedNavigation();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
      }}
    >
      <Pressable
        onPress={() => {
          navigation.navigate('Tabs', { screen: 'Account' });
        }}
      >
        <FastAvatar
          name={signedInUser?.name}
          address={publicKeyToAddress(signedInUser?.spendingPubKey as Hex)}
          size={40}
          imageUrl={signedInUser?.profileImage}
        />
      </Pressable>
    </View>
  );
};

const NUM_TRANSFERS_TO_FETCH = 5;

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
      <HomeHeader />
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 28,
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
      {/* Transfer history */}
      <View
        style={{
          flexDirection: 'column',
        }}
      >
        {transferHistory?.map((transfer, i) => (
          <TransferHistoryListItem
            key={i}
            transfer={transfer}
            type={transfer.transferType as 'incoming' | 'outgoing'}
          />
        ))}
        {transferHistory && transferHistory.length >= NUM_TRANSFERS_TO_FETCH ? (
          <Text
            style={{
              textAlign: 'right',
              marginVertical: spacing.base,
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
      {/* Assets list */}
      <Text
        style={{
          fontSize: fontSizes.base,
          color: colors.text,
          fontWeight: 'bold',
        }}
      >
        {t('assets')}
      </Text>
      <View style={{ flexDirection: 'column' }}>
        {tokenBalances?.map((tokenBalance, i) => (
          <TokenBalanceListItem
            key={i}
            balance={BigInt(tokenBalance.balance)}
            tokenId={tokenBalance.tokenId}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
