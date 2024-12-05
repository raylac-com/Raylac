import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { supportedChains, SupportedTokensReturnType } from '@raylac/shared';
import { useState } from 'react';
import { FlatList, Image, Pressable, TextInput } from 'react-native';
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
      <StyledText>{token.name}</StyledText>
      {balance && (
        <StyledText>
          {balance.toLocaleString()} {token.symbol}
        </StyledText>
      )}
    </Pressable>
  );
};

const SearchInput = ({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) => {
  return (
    <TextInput
      placeholder="Search for a token"
      value={value}
      onChangeText={onChangeText}
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
  const [searchText, setSearchText] = useState('');

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
      <SearchInput value={searchText} onChangeText={setSearchText} />
      <FlatList
        data={supportedTokens.filter(token =>
          token.name.toLowerCase().includes(searchText.toLowerCase())
        )}
        contentContainerStyle={{
          marginTop: 14,
          rowGap: 16,
        }}
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
