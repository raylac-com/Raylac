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
import { useCallback, useState } from 'react';
import TransferHistoryListItem from '@/components/TransferHistoryListItem';

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
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const NUM_TRANSFERS_TO_SHOW = 5;

const HomeScreen = () => {
  const { data: balance } = trpc.getBalance.useQuery();
  const { data: txHistory } = trpc.getTxHistory.useQuery();
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useTypedNavigation();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
            }}
          >
            {balance ? formatUnits(BigInt(balance), 6) : ''} USD
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
            icon={<AntDesign name="plus" size={24} color={theme.color} />}
            title="Add money"
            onPress={() => {
              navigation.navigate('EnterDepositInfo');
            }}
          />
          <MenuItem
            icon={<AntDesign name="arrowup" size={24} color={theme.color} />}
            title="Send"
            onPress={() => {
              navigation.navigate('Send');
            }}
          />
          <MenuItem
            icon={<AntDesign name="arrowdown" size={24} color={theme.color} />}
            title="Receive"
            onPress={() => {
              navigation.navigate('Receive');
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
              }}
            >
              No transactions
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
