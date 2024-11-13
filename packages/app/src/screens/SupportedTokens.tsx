import { getChainLogo } from '@/lib/logo';
import colors from '@/lib/styles/colors';
import { RootStackParamsList } from '@/navigation/types';
import {
  getChainFromId,
  SupportedToken,
  supportedTokens,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Text, View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamsList, 'SupportedTokens'>;

const SupportedTokenListItem = (props: { token: SupportedToken }) => {
  const { token } = props;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
        borderBottomColor: colors.gray,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        paddingVertical: 16,
      }}
    >
      <Image
        source={{ uri: token.logoURI }}
        style={{ width: 20, height: 20 }}
      />
      <Text style={{ color: colors.text, fontSize: 16 }}>{token.name}</Text>
    </View>
  );
};

const SupportedTokens = ({ route }: Props) => {
  const { chainId } = route.params;

  const chainSupportedTokens = supportedTokens
    .filter(token =>
      token.addresses.find(address => address.chain.id === chainId)
    )
    .flat();

  const { t } = useTranslation('SupportedTokens');

  const chain = getChainFromId(chainId);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18 }}>
          {t('tokensOnChain', { chain: chain.name })}
        </Text>
        <Image
          source={getChainLogo(chainId)}
          style={{ width: 28, height: 28 }}
        />
      </View>
      <FlatList
        style={{
          flex: 1,
          flexDirection: 'column',
          padding: 16,
        }}
        data={chainSupportedTokens}
        renderItem={({ item }) => <SupportedTokenListItem token={item} />}
      />
    </View>
  );
};

export default SupportedTokens;
