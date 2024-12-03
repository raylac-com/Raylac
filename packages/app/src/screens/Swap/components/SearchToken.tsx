import colors from '@/lib/styles/colors';
import spacing from '@/lib/styles/spacing';
import { trpc } from '@/lib/trpc';
import { supportedChains } from '@raylac/shared';
import { FlatList, Image, Text, TextInput, View } from 'react-native';
import { SupportedToken } from '@/types';

const TokenListItem = ({ token }: { token: SupportedToken }) => {
  return (
    <View
      style={{
        padding: spacing.default,
        borderBottomWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
      }}
    >
      <Image
        source={{ uri: token.metadata?.logoURI }}
        style={{ width: 24, height: 24 }}
      />
      <Text>{token.name}</Text>
      <Text>{token.symbol}</Text>
    </View>
  );
};

const SearchToken = () => {
  const { data: supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

  return (
    <View>
      <TextInput />
      <FlatList
        data={supportedTokens}
        renderItem={({ item }) => <TokenListItem token={item} />}
      />
    </View>
  );
};

export default SearchToken;
