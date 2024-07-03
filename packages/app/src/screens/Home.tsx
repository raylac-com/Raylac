import { Pressable, Text, View } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc } from '@/lib/trpc';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { Hex, formatUnits, parseUnits } from 'viem';
import { shortenAddress } from '@/lib/utils';
import { theme } from '@/lib/theme';
import FastAvatar from '@/components/FastAvatar';

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

interface IncomingTransferListItemProps {
  tx: {
    from: string;
    amount: number;
  };
}

const IncomingTransferListItem = (props: IncomingTransferListItemProps) => {
  const { tx } = props;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <FastAvatar address={tx.from} size={36}></FastAvatar>
        <Text>{shortenAddress(tx.from as Hex)}</Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <AntDesign name="arrowdown" size={16} color={theme.blue} />
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          {tx.amount} USDC
        </Text>
      </View>
    </View>
  );
};

interface OutGoingTransferListItemProps {
  tx: {
    to: string;
    amount: number;
  };
}

const OutGoingTransferListItem = (props: OutGoingTransferListItemProps) => {
  const { tx } = props;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <FastAvatar address={tx.to} size={36}></FastAvatar>
        <Text>{shortenAddress(tx.to as Hex)}</Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <AntDesign name="arrowup" size={16} color={theme.waning} />
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          {tx.amount} USDC
        </Text>
      </View>
    </View>
  );
};



interface TransferHistoryListItemProps {
  tx: {
    from: string;
    to: string;
    type: string;
    amount: number;
  };
}

const TransferHistoryListItem = (props: TransferHistoryListItemProps) => {
  const { tx } = props;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        padding: 24,
      }}
    >
      {tx.type === 'incoming' ? (
        <IncomingTransferListItem tx={tx} />
      ) : (
        <OutGoingTransferListItem tx={tx} />
      )}
    </View>
  );
};

const HomeScreen = () => {
  const { data: balance } = trpc.getBalance.useQuery();
  const { data: txHistory } = trpc.getTxHistory.useQuery();

  console.log(txHistory);

  const navigation = useTypedNavigation();

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
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
    </View>
  );
};

export default HomeScreen;
