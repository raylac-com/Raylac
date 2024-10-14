import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import useSignedInUser from '@/hooks/useSignedInUser';
import { trpc } from '@/lib/trpc';
import { FlatList, Text, View } from 'react-native';

const TransferHistory = () => {
  const { data: txHistory } = trpc.getTxHistory.useQuery();
  const { data: signedInUser } = useSignedInUser();

  return (
    <View
      style={{
        marginTop: 40,
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
        data={txHistory}
        renderItem={({ item }) => (
          <TransferHistoryListItem
            transfer={item}
            type={
              item.traces[0].UserStealthAddressFrom?.userId === signedInUser?.id
                ? 'outgoing'
                : 'incoming'
            }
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
