import StyledText from '@/components/StyledText/StyledText';
import useUserAddresses from '@/hooks/useUserAddresses';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, View } from 'react-native';
import { Hex } from 'viem';

const AddressListItem = ({
  address,
  onPress,
}: {
  address: Hex;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        columnGap: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
        >
          <StyledText>{shortenAddress(address)}</StyledText>
        </View>
      </View>
    </Pressable>
  );
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectFromAddress'>;

const SelectFromAddress = ({ navigation, route }: Props) => {
  const toAddress = route.params.toAddress;
  const token = route.params.token;
  const { data: addresses } = useUserAddresses();

  const onAddressPress = (address: Hex) => {
    navigation.navigate('SelectAmount', {
      toAddress,
      token,
      fromAddresses: [address],
    });
  };

  return (
    <View style={{ flex: 1, padding: 16, rowGap: 16 }}>
      <FlatList
        data={addresses}
        contentContainerStyle={{
          rowGap: 16,
        }}
        renderItem={({ item }) => (
          <AddressListItem
            address={item.address}
            onPress={() => onAddressPress(item.address)}
          />
        )}
      ></FlatList>
    </View>
  );
};

export default SelectFromAddress;
