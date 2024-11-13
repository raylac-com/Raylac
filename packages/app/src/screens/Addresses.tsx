import colors from '@/lib/styles/colors';
import spacing from '@/lib/styles/spacing';
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
        padding: spacing.small,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={{
            color: colors.text,
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
          color={colors.primary}
          onPress={onCopyPress}
        />
      </View>
    </View>
  );
};

const Addresses = () => {
  const { t } = useTranslation('Addresses');
  const { data: addressesWithBalances } = trpc.getStealthAccounts.useQuery();

  if (!addressesWithBalances) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
      }}
    >
      <FlatList
        ListEmptyComponent={
          <Text
            style={{
              color: colors.text,
              textAlign: 'center',
              padding: 16,
            }}
          >
            {t('noAddresses')}
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
