import { shortenAddress } from '@/lib/utils';
import { Text, View } from 'react-native';
import FastAvatar from './FastAvatar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { Hex } from 'viem';

interface IncomingTransferListItemProps {
  tx: {
    from: string;
    amount: number;
    timestamp: number;
  };
}

const IncomingTransferListItem = (props: IncomingTransferListItemProps) => {
  const { tx } = props;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
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
          <Text
            style={{
              color: theme.text,
            }}
          >
            {shortenAddress(tx.from as Hex)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 4,
          }}
        >
          <Ionicons name="arrow-down-outline" size={18} color={theme.green} />
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: theme.green,
            }}
          >
            {tx.amount} USDC
          </Text>
        </View>
      </View>
      <Text
        style={{
          color: theme.text,
          marginTop: 4,
          textAlign: 'right',
          opacity: 0.5,
        }}
      >
        {new Date(tx.timestamp).toLocaleDateString()}
      </Text>
    </View>
  );
};

interface OutGoingTransferListItemProps {
  tx: {
    to: string;
    amount: number;
    timestamp: number;
  };
}

const OutGoingTransferListItem = (props: OutGoingTransferListItemProps) => {
  const { tx } = props;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
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
          <Text
            style={{
              color: theme.text,
            }}
          >
            {shortenAddress(tx.to as Hex)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 4,
          }}
        >
          <Ionicons name="arrow-up-outline" size={18} color={theme.waning} />
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: theme.waning,
            }}
          >
            {tx.amount} USDC
          </Text>
        </View>
      </View>
      <Text
        style={{
          color: theme.text,
          marginTop: 4,
          textAlign: 'right',
          opacity: 0.5,
        }}
      >
        {new Date(tx.timestamp).toLocaleDateString()}
      </Text>
    </View>
  );
};

interface TransferHistoryListItemProps {
  tx: {
    from: string;
    to: string;
    type: string;
    amount: number;
    timestamp: number;
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

export default TransferHistoryListItem;
