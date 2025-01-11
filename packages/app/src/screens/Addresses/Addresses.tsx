import Feather from '@expo/vector-icons/Feather';
import StyledText from '@/components/StyledText/StyledText';
import useUserAddresses from '@/hooks/useUserAddresses';
import { Alert, FlatList, Pressable, View } from 'react-native';
import React, { useState } from 'react';
import AddressDetailsSheet from '@/components/AddressDetailsSheet/AddressDetailsSheet';
import colors from '@/lib/styles/colors';
import { copyToClipboard } from '@/lib/utils';
import Toast from 'react-native-toast-message';
import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useDeleteAddress from '@/hooks/useDeleteAddress';
import { supportedChains } from '@raylac/shared';
import ChainLogo from '@/components/ChainLogo/ChainLogo';
import { UserAddress } from '@/types';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';
import { useTranslation } from 'react-i18next';

const AddressListItem = ({ address }: { address: UserAddress }) => {
  const { t } = useTranslation('AddressListItem');
  const { mutateAsync: deleteAddress } = useDeleteAddress();

  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );

  const onCopyPress = () => {
    copyToClipboard(address.address);

    Toast.show({
      type: 'success',
      text1: 'Address copied to clipboard',
      position: 'bottom',
      bottomOffset: 100,
    });
  };

  const onRemovePress = () => {
    Alert.alert(
      'Remove address',
      'Are you sure you want to remove this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteAddress(address.address);
            Toast.show({
              type: 'success',
              text1: 'Address removed',
              position: 'bottom',
              bottomOffset: 100,
            });
          },
        },
      ]
    );
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingRight: 16,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 16,
          shadowColor: colors.border,
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.5,
          shadowRadius: 3.84,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
        >
          <Pressable onPress={onCopyPress}>
            <Feather name="copy" size={20} color={colors.border} />
          </Pressable>
          <Pressable onPress={() => setSelectedAddress(address)}>
            <WalletIconAddress address={address.address} />
          </Pressable>
          {address.isDefault && (
            <StyledText style={{ color: colors.subbedText }}>
              {t('Addresses.default')}
            </StyledText>
          )}
        </View>
        <Feather
          name="x"
          size={20}
          color={colors.border}
          onPress={onRemovePress}
        />
      </View>
      {selectedAddress && (
        <AddressDetailsSheet
          address={selectedAddress.address}
          addressType={selectedAddress.type}
          onClose={() => setSelectedAddress(null)}
        />
      )}
    </>
  );
};

const SupportedChains = () => {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row',
        width: '100%',
        columnGap: 8,
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>
        {t('Addresses.supportedChains')}
      </StyledText>
      <View style={{ flexDirection: 'row', columnGap: 4 }}>
        {supportedChains.map(chain => (
          <ChainLogo key={chain.id} chainId={chain.id} size={16} />
        ))}
      </View>
    </View>
  );
};

const Addresses = () => {
  const { t } = useTranslation('Addresses');
  const { data: addresses } = useUserAddresses();
  const navigation = useTypedNavigation();
  const insets = useSafeAreaInsets();

  const onAddAddressPress = () => {
    navigation.navigate('AddAddress');
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 16,
        rowGap: 32,
      }}
    >
      <SupportedChains />
      <FlatList
        data={addresses}
        renderItem={({ item }) => <AddressListItem address={item} />}
        contentContainerStyle={{ rowGap: 16 }}
      />
      <StyledButton
        title={t('Addresses.addAddress')}
        onPress={onAddAddressPress}
      />
    </View>
  );
};

export default Addresses;
