import StyledText from '@/components/StyledText/StyledText';
import useUserAddresses from '@/hooks/useUserAddresses';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { getAddressChainTokenBalance, Token } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, View } from 'react-native';
import { Hex } from 'viem';

const AddressListItem = ({
  address,
  token,
  chainId,
  onPress,
}: {
  address: Hex;
  token: Token;
  chainId: number;
  onPress: () => void;
}) => {
  const { data: addresses } = useUserAddresses();
  const { data: tokenBalances } = trpc.getTokenBalances.useQuery({
    addresses: addresses?.map(address => address.address) ?? [],
  });

  const tokenBalance = tokenBalances
    ? getAddressChainTokenBalance({
        tokenBalances: tokenBalances,
        address,
        chainId,
        token,
      })
    : null;

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
          <StyledText style={{ color: colors.border }}>
            {`$${tokenBalance?.usdValue ?? ''}`}
          </StyledText>
        </View>
      </View>
    </Pressable>
  );
};

/**
 * Get a list of addresses with the balance of the given token
 */
const useAddressesWithTokenBalance = ({
  token,
  addresses,
  chainId,
}: {
  token: Token;
  addresses: Hex[];
  chainId: number;
}) => {
  const { data: userAddresses } = useUserAddresses();
  const { data: tokenBalances } = trpc.getTokenBalances.useQuery({
    addresses: userAddresses?.map(address => address.address) ?? [],
  });

  const addressesWithTokenBalance = tokenBalances
    ? addresses.map(address => {
        const tokenBalance = getAddressChainTokenBalance({
          address,
          chainId,
          token,
          tokenBalances,
        });
        return { address, tokenBalance };
      })
    : [];

  return { addressesWithTokenBalance };
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectFromAddress'>;

const SelectFromAddress = ({ navigation, route }: Props) => {
  const toAddress = route.params.toAddress;
  const token = route.params.token;
  const chainId = route.params.chainId;
  const { data: addresses } = useUserAddresses();

  const { addressesWithTokenBalance } = useAddressesWithTokenBalance({
    token,
    addresses: addresses?.map(address => address.address) ?? [],
    chainId,
  });

  const onAddressPress = (address: Hex) => {
    navigation.navigate('SelectAmount', {
      toAddress,
      token,
      chainId,
      fromAddresses: [address],
    });
  };

  return (
    <View style={{ flex: 1, padding: 16, rowGap: 16 }}>
      <FlatList
        data={addressesWithTokenBalance}
        contentContainerStyle={{
          rowGap: 16,
        }}
        renderItem={({ item }) => (
          <AddressListItem
            address={item.address}
            token={token}
            chainId={chainId}
            onPress={() => onAddressPress(item.address)}
          />
        )}
      ></FlatList>
    </View>
  );
};

export default SelectFromAddress;
