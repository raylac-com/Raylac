import Skeleton from '@/components/Skeleton/Skeleton';
import StyledText from '@/components/StyledText/StyledText';
import useDebounce from '@/hooks/useDebounce';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { formatAmount, supportedChains, Token } from '@raylac/shared';
import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import TokenLogo from '../FastImage/TokenLogo';
import useUserAccount from '@/hooks/useUserAccount';
import { getAddress, hexToBigInt, zeroAddress } from 'viem';
import Ionicons from '@expo/vector-icons/Ionicons';

const TokenListItem = ({
  token,
  balance,
  onPress,
}: {
  token: {
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    verified: boolean;
  };
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
      <TokenLogo
        source={{ uri: token.logoURI }}
        style={{ width: 42, height: 42 }}
      />
      <View style={{ flexDirection: 'column', rowGap: 4 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
        >
          <StyledText>{token.name}</StyledText>
          {token.verified && (
            <Ionicons name="shield-checkmark" size={18} color={colors.green} />
          )}
        </View>
        <StyledText style={{ color: colors.border }}>
          {formatAmount(balance.toString(), token.decimals)} {token.symbol}
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
      autoCapitalize="none"
      autoFocus={false}
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
  onSelectToken: (token: Token) => void;
  onClose: () => void;
}) => {
  const { data: userAccount } = useUserAccount();
  const ref = useRef<BottomSheet>(null);
  const [searchText, setSearchText] = useState('');

  const { debouncedValue: debouncedSearchText, isPending: isDebouncing } =
    useDebounce(searchText, 500);

  const { data: tokenBalances, isLoading: isLoadingTokenBalances } =
    trpc.getTokenBalances.useQuery(
      {
        address: userAccount?.address ?? zeroAddress,
      },
      {
        enabled: !!userAccount,
      }
    );

  const { data: supportedTokens, isLoading: isLoadingSupportedTokens } =
    trpc.getSupportedTokens.useQuery(
      {
        chainIds: supportedChains.map(chain => chain.id),
        searchTerm: debouncedSearchText,
      },
      {
        enabled: !isLoadingTokenBalances,
      }
    );

  const tokensWithBalances =
    tokenBalances
      ?.filter(
        token =>
          token.token.name
            .toLowerCase()
            .includes(debouncedSearchText.toLowerCase()) ||
          token.token.symbol
            .toLowerCase()
            .includes(debouncedSearchText.toLowerCase())
      )
      .map(token => ({
        token: token.token,
        balance: hexToBigInt(token.balance),
      })) ?? [];

  // Get the token addresses of the tokens with balances
  const tokenAddressesWithBalances = tokensWithBalances.flatMap(token =>
    token.token.addresses.map(address => getAddress(address.address))
  );

  // Get the tokens without balances
  const tokensWithoutBalances =
    supportedTokens
      ?.filter(
        token =>
          !token.addresses.some(address =>
            tokenAddressesWithBalances.includes(getAddress(address.address))
          )
      )
      .map(token => ({
        token: token,
        balance: BigInt(0),
      })) ?? [];

  const tokenList = [...tokensWithBalances, ...tokensWithoutBalances];

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
      enableDynamicSizing={false}
    >
      <SearchInput value={searchText} onChangeText={setSearchText} />
      <BottomSheetFlatList
        data={
          isLoadingTokenBalances || isLoadingSupportedTokens || isDebouncing
            ? new Array(3).fill(undefined)
            : tokenList
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
          item: (typeof tokenList)[number] | undefined;
        }) => {
          if (item === undefined) {
            return <Skeleton style={{ width: '100%', height: 42 }} />;
          }

          return (
            <TokenListItem
              token={item.token}
              balance={item.balance}
              onPress={() => {
                onSelectToken(item.token);
              }}
            />
          );
        }}
      />
    </BottomSheet>
  );
};

export default SearchTokenSheet;
