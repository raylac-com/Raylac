import Skeleton from '@/components/Skeleton/Skeleton';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { Balance, supportedChains, Token } from '@raylac/shared';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import TokenLogo from '../FastImage/TokenLogo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getChainIcon } from '@/lib/utils';
import useTokenBalances from '@/hooks/useTokenBalances';

const TokenListItem = ({
  token,
  balance,
  onPress,
}: {
  token: Token;
  balance: Balance | null;
  onPress: () => void;
}) => {
  const tokenChainIds = token.addresses.map(address => address.chainId);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        columnGap: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}
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
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.green}
              />
            )}
          </View>
          <StyledText style={{ color: colors.border }}>
            {balance?.formatted} {token.symbol}
          </StyledText>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {tokenChainIds.map((chainId, i) => (
          <Image
            key={i}
            source={getChainIcon(chainId)}
            style={{ width: 18, height: 18, marginLeft: -9 }}
          />
        ))}
      </View>
    </Pressable>
  );
};

export const SearchInput = ({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) => {
  return (
    <BottomSheetTextInput
      placeholder="Search for a token"
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
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
  const ref = useRef<BottomSheet>(null);
  const [searchText, setSearchText] = useState('');

  const { data: tokenBalances, isLoading: isLoadingTokenBalances } =
    useTokenBalances();

  const { data: supportedTokens, isLoading: isLoadingSupportedTokens } =
    trpc.getSupportedTokens.useQuery(
      {
        chainIds: supportedChains.map(chain => chain.id),
        searchTerm: searchText,
      },
      {
        enabled: !isLoadingTokenBalances,
      }
    );

  const tokensWithBalances =
    tokenBalances?.filter(
      token =>
        token.token.name.toLowerCase().includes(searchText.toLowerCase()) ||
        token.token.symbol.toLowerCase().includes(searchText.toLowerCase())
    ) ?? [];

  // Get the token addresses of the tokens with balances
  const tokenAddressesWithBalances = tokensWithBalances.flatMap(token =>
    token.token.addresses.map(address => address.address)
  );

  // Get the tokens without balances
  const tokensWithoutBalances =
    supportedTokens
      ?.filter(
        token =>
          !token.addresses.some(address =>
            tokenAddressesWithBalances.includes(address.address)
          )
      )
      .map(token => ({
        token: token,
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
          isLoadingTokenBalances || isLoadingSupportedTokens
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
              balance={null}
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
