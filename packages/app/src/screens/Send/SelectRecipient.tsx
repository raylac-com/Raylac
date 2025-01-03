import { Pressable, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import colors from '@/lib/styles/colors';
import { Hex, isAddress } from 'viem';
import { shortenAddress } from '@/lib/utils';
import fontSizes from '@/lib/styles/fontSizes';
import Blockie from '@/components/Blockie/Blockie';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamsList } from '@/navigation/types';
import useEnsAddress from '@/hooks/useEnsAddress';
import useUserAddresses from '@/hooks/useUserAddresses';

interface AddressListItemProps {
  address: Hex;
  onPress: () => void;
}

const AddressListItem = (props: AddressListItemProps) => {
  const { onPress, address } = props;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}
    >
      <Blockie address={address} size={36}></Blockie>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          columnGap: 4,
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.base,
            fontWeight: 'bold',
            color: colors.text,
          }}
        >
          {shortenAddress(address)}
        </Text>
      </View>
    </Pressable>
  );
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectRecipient'>;

const SelectRecipient = ({ navigation }: Props) => {
  const { data: userAddresses } = useUserAddresses();

  const [searchInput, setSearchInput] = useState('');
  const [inputAddress, setInputAddress] = useState<Hex | null>(null);

  const { data: ensAddress } = useEnsAddress(searchInput);

  useEffect(() => {
    if (isAddress(searchInput)) {
      setInputAddress(searchInput);
    } else if (ensAddress) {
      setInputAddress(ensAddress);
    } else {
      setInputAddress(null);
    }
  }, [searchInput, ensAddress]);

  const onAddressPress = (address: Hex) => {
    navigation.navigate('SelectToken', {
      toAddress: address,
    });
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <TextInput
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        value={searchInput}
        placeholder="ENS or Ethereum address"
        onChangeText={setSearchInput}
        testID="search-ethereum-address"
        style={{
          width: '100%',
          height: 56,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 4,
        }}
      ></TextInput>
      <View style={{ marginTop: 24, width: '100%', rowGap: 20 }}>
        {inputAddress && (
          <AddressListItem
            address={inputAddress}
            onPress={() => {
              onAddressPress(inputAddress);
            }}
          ></AddressListItem>
        )}
        {userAddresses?.map(a => (
          <AddressListItem
            address={a.address}
            onPress={() => {
              onAddressPress(a.address);
            }}
          ></AddressListItem>
        ))}
      </View>
    </View>
  );
};

export default SelectRecipient;
