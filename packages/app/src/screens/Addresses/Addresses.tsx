import Feather from '@expo/vector-icons/Feather';
import StyledText from '@/components/StyledText/StyledText';
import useUserAddresses from '@/hooks/useUserAddresses';
import { Alert, FlatList, Image, Pressable, View } from 'react-native';
import { Hex } from 'viem';
import colors from '@/lib/styles/colors';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import Toast from 'react-native-toast-message';
import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import useDeleteAddress from '@/hooks/useDeleteAddress';
import { supportedChains } from '@raylac/shared';
import { getChainIcon } from '@/lib/utils';

const AddressListItem = ({ address }: { address: Hex }) => {
  const { mutateAsync: deleteAddress } = useDeleteAddress();

  const onCopyPress = () => {
    copyToClipboard(address);

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
            await deleteAddress(address);
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
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingRight: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
        onPress={onCopyPress}
      >
        <Feather name="copy" size={20} color={colors.border} />
        <StyledText
          style={{
            fontWeight: 'bold',
          }}
        >
          {shortenAddress(address)}
        </StyledText>
      </Pressable>
      <FontAwesome
        name="remove"
        size={20}
        color={colors.border}
        onPress={onRemovePress}
      />
    </View>
  );
};

const SupportedChains = () => {
  return (
    <View
      style={{
        flexDirection: 'row',
        width: '100%',
        columnGap: 8,
      }}
    >
      <StyledText style={{ color: colors.subbedText }}>
        {`Supported chains`}
      </StyledText>
      <View style={{ flexDirection: 'row', columnGap: 4 }}>
        {supportedChains.map(chain => (
          <Image
            key={chain.id}
            source={getChainIcon(chain.id)}
            style={{ width: 24, height: 24 }}
          />
        ))}
      </View>
    </View>
  );
};

const Addresses = () => {
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
        padding: 16,
        paddingBottom: insets.bottom,
        rowGap: 32,
      }}
    >
      <SupportedChains />
      <FlatList
        data={addresses}
        renderItem={({ item }) => <AddressListItem address={item.address} />}
        contentContainerStyle={{ rowGap: 16 }}
      />
      <StyledButton title="Add address" onPress={onAddAddressPress} />
    </View>
  );
};

export default Addresses;
