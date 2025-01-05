import Skeleton from '@/components/Skeleton/Skeleton';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { TokenAmount, Token } from '@raylac/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import TokenLogo from '../TokenLogo/TokenLogo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getChainIcon } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTokenBalancePerAddress from '@/hooks/useTokenBalancePerAddress';
import { Hex } from 'viem/_types/types/misc';

const TokenListItem = ({
  token,
  balance,
  onPress,
}: {
  token: Token;
  balance: TokenAmount | null;
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
  value: _value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) => {
  return (
    <BottomSheetTextInput
      placeholder="Search for a token"
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

const SearchInputTokenSheet = ({
  address,
  open,
  onSelectToken,
  onClose,
}: {
  address: Hex | null;
  open: boolean;
  onSelectToken: (token: Token) => void;
  onClose: () => void;
}) => {
  const ref = useRef<BottomSheetModal>(null);
  const [searchText, setSearchText] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [open]);

  const tokenBalancePerAddress = useTokenBalancePerAddress({
    addresses: address ? [address] : [],
  });

  const tokenList =
    tokenBalancePerAddress && tokenBalancePerAddress.length > 0
      ? tokenBalancePerAddress[0].tokenBalances
      : [undefined];

  const tokenListSearchResults = useMemo(() => {
    return searchText
      ? tokenList.filter(
          token =>
            token?.token.symbol
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            token?.token.name.toLowerCase().includes(searchText.toLowerCase())
        )
      : tokenList;
  }, [searchText, tokenList]);

  return (
    <BottomSheetModal
      ref={ref}
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
      }}
      index={0}
      snapPoints={['100%']}
      enablePanDownToClose
      onDismiss={onClose}
      enableDynamicSizing={false}
    >
      <SearchInput
        value={searchText}
        onChangeText={text => {
          setSearchText(text);
        }}
      />
      <BottomSheetFlatList
        data={tokenListSearchResults}
        contentContainerStyle={{
          marginTop: 14,
          rowGap: 16,
        }}
        ListEmptyComponent={
          <StyledText style={{ textAlign: 'center', color: colors.border }}>
            {`No tokens found`}
          </StyledText>
        }
        keyExtractor={(_item, index) => index.toString()}
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
    </BottomSheetModal>
  );
};

export default SearchInputTokenSheet;
