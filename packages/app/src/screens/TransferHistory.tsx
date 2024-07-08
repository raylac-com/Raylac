import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import { trpc } from '@/lib/trpc';
import { FlatList, Text, View } from 'react-native';

const TransferHistory = () => {
  const { data: txHistory } = trpc.getTxHistory.useQuery();

  return (
    <View
      style={{
        marginTop: 40,
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <FlatList
        data={txHistory}
        renderItem={({ item }) => (
          <TransferHistoryListItem
            tx={{
              from: item.from,
              to: item.to,
              amount: item.amount,
              type: item.type,
              timestamp: item.timestamp,
            }}
          />
        )}
      />
      {txHistory?.length === 0 ? (
        <Text
          style={{
            textAlign: 'center',
            marginTop: 20,
            opacity: 0.5,
          }}
        >
          No transfers
        </Text>
      ) : null}
    </View>
  );
};

export default TransferHistory;
