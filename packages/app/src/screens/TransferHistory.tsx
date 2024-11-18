import TransferHistoryListItem from '@/components/TransferHistoryListItem';
import useSignedInUser from '@/hooks/useSignedInUser';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';

const TransferHistory = () => {
  const { data: transferHistory } = trpc.getTransferHistory.useQuery({});
  const { data: signedInUser } = useSignedInUser();
  const { t } = useTranslation('TransferHistory');

  return (
    <View
      style={{
        marginTop: spacing.base,
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
        data={transferHistory}
        renderItem={({ item }) => (
          <TransferHistoryListItem
            transfer={item}
            type={
              item.transactions[0].traces[0].UserStealthAddressFrom?.userId ===
              signedInUser?.id
                ? 'outgoing'
                : 'incoming'
            }
          />
        )}
      />
      {transferHistory?.length === 0 ? (
        <Text
          style={{
            textAlign: 'center',
            marginTop: 20,
            opacity: 0.5,
          }}
        >
          {t('noTransfers', { ns: 'TransferHistory' })}
        </Text>
      ) : null}
    </View>
  );
};

export default TransferHistory;
