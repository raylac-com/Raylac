import Feather from '@expo/vector-icons/Feather';
import StyledText from '@/components/StyledText/StyledText';
import useUserAddresses from '@/hooks/useUserAddresses';
import { FlatList, View } from 'react-native';
import { Hex } from 'viem';
import colors from '@/lib/styles/colors';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import Toast from 'react-native-toast-message';
import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddressListItem = ({ address }: { address: Hex }) => {
  const onCopyPress = () => {
    copyToClipboard(address);

    Toast.show({
      type: 'success',
      text1: 'Address copied to clipboard',
      position: 'bottom',
      bottomOffset: 100,
    });
  };

  return (
    <View style={{ flexDirection: 'row', columnGap: 8 }}>
      <Feather
        name="copy"
        size={20}
        color={colors.border}
        onPress={onCopyPress}
      />
      <StyledText
        style={{
          fontWeight: 'bold',
        }}
      >
        {shortenAddress(address)}
      </StyledText>
    </View>
  );
};

const Addresses = () => {
  const { data: addresses } = useUserAddresses();
  const navigation = useTypedNavigation();

  const onAddAddressPress = () => {
    navigation.navigate('AddAddress');
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
      <FlatList
        data={addresses}
        renderItem={({ item }) => <AddressListItem address={item.address} />}
        contentContainerStyle={{ rowGap: 10 }}
      />
      <StyledButton title="Add address" onPress={onAddAddressPress} />
    </SafeAreaView>
  );
};

export default Addresses;
