import {
  Pressable,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { formatUnits } from 'viem';
import { theme } from '@/lib/theme';
import { useCallback, useEffect } from 'react';
import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import useIsSignedIn from '@/hooks/useIsSignedIn';
import { useTranslation } from 'react-i18next';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

const MenuItem = (props: MenuItemProps) => {
  const { icon, title, onPress } = props;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: theme.primary,
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
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const NUM_TRANSFERS_TO_SHOW = 5;

const HomeScreen = () => {
  const { t } = useTranslation('Home');
  const { data: isSignedIn } = useIsSignedIn();

  const {
    data: balance,
    refetch: refetchBalance,
    isRefetching: isRefetchingBalance,
  } = trpc.getBalance.useQuery(null, {
    enabled: isSignedIn,
  });

  const {
    data: txHistory,
    refetch: refetchTxHistory,
    isRefetching: isRefetchingTxHistory,
  } = trpc.getTxHistory.useQuery(null, {
    enabled: isSignedIn,
  });

  const navigation = useTypedNavigation();

  const onRefresh = useCallback(() => {
    refetchBalance();
    refetchTxHistory();
  }, [refetchBalance, refetchTxHistory]);

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
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 24,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              color: theme.text,
            }}
          >
            {balance !== undefined ? formatUnits(BigInt(balance), 6) : ''} USD
          </Text>
        </View>
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
              navigation.navigate('EnterDepositAmount');
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
              tx={{
                from: tx.from,
                to: tx.to,
                amount: tx.amount,
                type: tx.type,
                timestamp: tx.timestamp,
              }}
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
              See all
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
