import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import { Feather } from '@expo/vector-icons';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Hex } from 'viem';

interface AddressListItemProps {
  address: Hex;
}

const AddressListItem = (props: AddressListItemProps) => {
  const { address } = props;
  const { t } = useTranslation();

  const onCopyPress = useCallback(() => {
    copyToClipboard(address);
    Toast.show({
      type: 'success',
      text1: t('copied', { ns: 'common' }),
      position: 'bottom',
    });
  }, [address]);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.gray,
      }}
    >
      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={{
            color: theme.text,
          }}
        >
          {shortenAddress(address)}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'flex-end',
        }}
      >
        <Feather
          name="copy"
          size={20}
          color={theme.primary}
          onPress={onCopyPress}
        />
      </View>
    </View>
  );
};

const Addresses = () => {
  const { data: addressesWithBalances } = trpc.getStealthAccounts.useQuery();

  if (!addressesWithBalances) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        marginTop: 16,
      }}
    >
      <FlatList
        ListEmptyComponent={
          <Text
            style={{
              color: theme.text,
              textAlign: 'center',
              padding: 16,
            }}
          >
            No addresses
          </Text>
        }
        data={addressesWithBalances}
        renderItem={({ item }) => (
          <AddressListItem address={item.address as Hex} />
        )}
      />
    </View>
  );
};

export default Addresses;
