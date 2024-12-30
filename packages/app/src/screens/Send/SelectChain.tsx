import StyledText from '@/components/StyledText/StyledText';
import { getChainIcon, shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { getChainTokenBalance, supportedChains, Token } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Chain } from 'viem';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import useUserAddresses from '@/hooks/useUserAddresses';

const ChainListItem = ({ chain, token }: { chain: Chain; token: Token }) => {
  const { data: addresses } = useUserAddresses();

  const { data: tokenBalance } = trpc.getTokenBalances.useQuery({
    addresses: addresses?.map(address => address.address) ?? [],
  });

  const chainTokenBalance = tokenBalance
    ? getChainTokenBalance({
        tokenBalances: tokenBalance,
        chainId: chain.id,
        token: token,
      })
    : null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
      >
        <Image
          source={getChainIcon(chain.id)}
          style={{ width: 42, height: 42 }}
        ></Image>
        <StyledText>{chain.name}</StyledText>
      </View>
      <StyledText>{chainTokenBalance?.usdValue}</StyledText>
    </View>
  );
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectChain'>;

const SelectChain = ({ navigation, route }: Props) => {
  const toAddress = route.params.toAddress;
  const token = route.params.token;

  const onChainSelect = (chainId: number) => {
    navigation.navigate('SelectFromAddress', {
      toAddress,
      token,
      chainId,
    });
  };

  return (
    <View style={{ flex: 1, padding: 16, rowGap: 16 }}>
      <StyledText style={{ color: colors.border }}>
        {`Send to ${shortenAddress(toAddress)}`}
      </StyledText>
      <FlatList
        data={supportedChains}
        contentContainerStyle={{ rowGap: 16 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => onChainSelect(item.id)}>
            <ChainListItem chain={item} token={token} />
          </Pressable>
        )}
      />
    </View>
  );
};

export default SelectChain;
