import { getChainLogo } from '@/lib/logo';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
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
        columnGap: spacing.xSmall,
        backgroundColor: colors.background,
        paddingVertical: spacing.small,
      }}
    >
      <Image
        source={{ uri: token.logoURI }}
        style={{ width: 28, height: 28 }}
      />
      <Text
        style={{
          color: colors.text,
          fontSize: fontSizes.base,
          fontWeight: 'bold',
        }}
      >
        {token.name}
      </Text>
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
    <View style={{ flex: 1, padding: spacing.base }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          columnGap: spacing.small,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: fontSizes.large,
            fontWeight: 'bold',
          }}
        >
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
