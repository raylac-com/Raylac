import StyledText from '@/components/StyledText/StyledText';
import { getChainIcon, shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { supportedChains } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Chain } from 'viem';
import colors from '@/lib/styles/colors';

const ChainListItem = ({ chain }: { chain: Chain }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
      <Image
        source={getChainIcon(chain.id)}
        style={{ width: 42, height: 42 }}
      ></Image>
      <StyledText>{chain.name}</StyledText>
    </View>
  );
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectChain'>;

const SelectChain = ({ navigation, route }: Props) => {
  const address = route.params.address;
  const amount = route.params.amount;
  const token = route.params.token;

  const onChainSelect = (chainId: number) => {
    navigation.navigate('ConfirmSend', {
      address,
      amount,
      token,
      outputChainId: chainId,
    });
  };

  return (
    <View style={{ flex: 1, padding: 16, rowGap: 16 }}>
      <StyledText style={{ color: colors.border }}>
        {`Send to ${shortenAddress(address)}`}
      </StyledText>
      <FlatList
        data={supportedChains}
        contentContainerStyle={{ rowGap: 16 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => onChainSelect(item.id)}>
            <ChainListItem chain={item} />
          </Pressable>
        )}
      />
    </View>
  );
};

export default SelectChain;
