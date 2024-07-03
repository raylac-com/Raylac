import { shortenAddress } from '@/lib/utils';
import { Text, View } from 'react-native';
import FastAvatar from './FastAvatar';
import { AntDesign } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { Hex } from 'viem';

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

export default TransferHistoryListItem;
