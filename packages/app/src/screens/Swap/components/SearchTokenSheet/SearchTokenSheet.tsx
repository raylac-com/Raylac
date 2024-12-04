import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { supportedChains, SupportedTokensReturnType } from '@raylac/shared';
import { FlatList, Image, Pressable, Text, TextInput } from 'react-native';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';

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

const SearchInput = () => {
  return (
    <TextInput
      placeholder="Search for a token"
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
        height: 54,
      }}
    />
  );
};

const SearchTokenSheet = () => {
  const { data: supportedTokens }: { data: SupportedTokensReturnType | null } =
    trpc.getSupportedTokens.useQuery({
      chainIds: supportedChains.map(chain => chain.id),
    });

  if (!supportedTokens) {
    return null;
  }

  return (
    <ActionSheet
      id="search-token-sheet"
      containerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 32,
        height: '90%',
      }}
    >
      <SearchInput />
      <FlatList
        data={supportedTokens}
        contentContainerStyle={{ rowGap: 16 }}
        renderItem={({ item }) => (
          <TokenListItem
            token={item}
            balance={BigInt(0)}
            onPress={() =>
              SheetManager.hide('search-token-sheet', {
                payload: item,
              })
            }
          />
        )}
      />
    </ActionSheet>
  );
};

export default SearchTokenSheet;
