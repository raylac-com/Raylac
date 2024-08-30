import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import { trpc } from '@/lib/trpc';
import { Transfer } from '@sutori/shared';
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
          <TransferHistoryListItem tx={item as Transfer} />
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
