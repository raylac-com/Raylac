import { Text, View, Image, FlatList, Pressable } from 'react-native';
import { Chain } from 'viem';
import colors from '@/lib/styles/colors';
import {
  supportedChains,
  SupportedToken,
  supportedTokens,
} from '@raylac/shared';
import { getChainLogo } from '@/lib/logo';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useTypedNavigation from '@/hooks/useTypedNavigation';

const SupportedTokenItem = (props: { token: SupportedToken }) => {
  const { token } = props;
  return (
    <Image
      source={{ uri: token.logoURI }}
      style={{ width: 20, height: 20, marginLeft: -10 }}
    ></Image>
  );
};

interface SupportedChainListItemProps {
  chain: Chain;
}

const SupportedChainListItem = (props: SupportedChainListItemProps) => {
  const { chain } = props;

  const chainSupportedTokens = supportedTokens
    .filter(token =>
      token.addresses.find(address => address.chain.id === chain.id)
    )
    .flat();

  const { t } = useTranslation('SupportedChains');

  const navigation = useTypedNavigation();

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomColor: colors.gray,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        paddingVertical: 16,
        rowGap: 8,
      }}
      onPress={() => {
        navigation.navigate('SupportedTokens', { chainId: chain.id });
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          columnGap: 8,
          alignItems: 'center',
        }}
      >
        <Image
          source={getChainLogo(chain.id)}
          style={{ width: 20, height: 20 }}
        ></Image>
        <Text style={{ color: colors.text, fontSize: 16 }}>{chain.name}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row' }}>
          {chainSupportedTokens.map(token => (
            <SupportedTokenItem key={token.tokenId} token={token} />
          ))}
        </View>
        <Text style={{ color: colors.gray, fontSize: 16 }}>{t('viewAll')}</Text>
        <AntDesign name="arrowright" size={16} color={colors.gray} />
      </View>
    </Pressable>
  );
};

const SupportedChains = () => {
  return (
    <FlatList
      style={{
        flex: 1,
        flexDirection: 'column',
        padding: 16,
      }}
      data={supportedChains}
      renderItem={({ item }) => <SupportedChainListItem chain={item} />}
    />
  );
};

export default SupportedChains;
