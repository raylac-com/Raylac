import Skeleton from '@/components/Skeleton/Skeleton';
import StyledText from '@/components/StyledText/StyledText';
import useDebounce from '@/hooks/useDebounce';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { supportedChains, SupportedTokensReturnType } from '@raylac/shared';
import { useRef, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';

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
      <View style={{ flexDirection: 'column', rowGap: 4 }}>
        <StyledText>{token.name}</StyledText>
        <StyledText style={{ color: colors.border }}>
          {balance.toLocaleString()} {token.symbol}
        </StyledText>
      </View>
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

const SearchTokenSheet = ({
  onSelectToken,
  onClose,
}: {
  onSelectToken: (token: SupportedTokensReturnType[number]) => void;
  onClose: () => void;
}) => {
  const ref = useRef<BottomSheet>(null);
  const [searchText, setSearchText] = useState('');

  const { debouncedValue: debouncedSearchText, isPending: isDebouncing } =
    useDebounce(searchText, 500);

  const { data: supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
    searchTerm: debouncedSearchText,
  });

  return (
    <BottomSheet
      ref={ref}
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 32,
      }}
      index={0}
      snapPoints={['100%']}
      enablePanDownToClose
      onClose={onClose}
    >
      <SearchInput value={searchText} onChangeText={setSearchText} />
      <BottomSheetFlatList
        data={
          supportedTokens === undefined || isDebouncing
            ? new Array(3).fill(undefined)
            : supportedTokens.filter(token =>
                token.name.toLowerCase().includes(searchText.toLowerCase())
              )
        }
        contentContainerStyle={{
          marginTop: 14,
          rowGap: 16,
        }}
        ListEmptyComponent={
          <StyledText style={{ textAlign: 'center', color: colors.border }}>
            {`No tokens found`}
          </StyledText>
        }
        renderItem={({
          item,
        }: {
          item: SupportedTokensReturnType[number] | undefined;
        }) => {
          if (item === undefined) {
            return <Skeleton style={{ width: '100%', height: 42 }} />;
          }

          return (
            <TokenListItem
              token={item}
              balance={BigInt(0)}
              onPress={() => {
                onSelectToken(item);
              }}
            />
          );
        }}
      />
    </BottomSheet>
  );
};

export default SearchTokenSheet;
