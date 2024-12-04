import { trpc } from '@/lib/trpc';
import { supportedChains, SupportedTokensReturnType } from '@raylac/shared';
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

const TokenListItem = ({
  token,
  balance,
  onPress,
}: {
  token: SupportedTokensReturnType[number];
  balance: bigint;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        columnGap: 8,
        alignItems: 'center',
      }}
    >
      <Image
        source={{ uri: token.logoURI }}
        style={{ width: 42, height: 42 }}
      />
      <Text>{token.name}</Text>
      {balance && (
        <Text>
          {balance.toLocaleString()} {token.symbol}
        </Text>
      )}
    </Pressable>
  );
};

interface SearchTokenProps {
  onSelectToken: (token: SupportedTokensReturnType[number]) => void;
}

const SearchToken = ({ onSelectToken }: SearchTokenProps) => {
  const { data: supportedTokens }: { data: SupportedTokensReturnType | null } =
    trpc.getSupportedTokens.useQuery({
      chainIds: supportedChains.map(chain => chain.id),
    });

  if (!supportedTokens) {
    return null;
  }

  return (
    <View>
      <TextInput />
      <FlatList
        data={supportedTokens}
        contentContainerStyle={{ rowGap: 16 }}
        renderItem={({ item }) => (
          <TokenListItem
            token={item}
            balance={BigInt(0)}
            onPress={() => onSelectToken(item)}
          />
        )}
      />
    </View>
  );
};

export default SearchToken;
