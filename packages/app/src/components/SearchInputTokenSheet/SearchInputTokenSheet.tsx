import Feather from '@expo/vector-icons/Feather';
import Skeleton from '@/components/Skeleton/Skeleton';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { TokenAmount, Token } from '@raylac/shared';
import { getCurrencyFormattedValue } from '@/lib/utils';
import useSelectedCurrency from '@/hooks/useSelectedCurrency';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import TokenLogo from '../TokenLogo/TokenLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTokenBalancePerAddress from '@/hooks/useTokenBalancePerAddress';
import { Hex } from 'viem/_types/types/misc';
import FeedbackPressable from '../FeedbackPressable/FeedbackPressable';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { useTranslation } from 'react-i18next';

const ChainTokenBalance = ({
  chainId,
  token,
  balance,
}: {
  chainId: number;
  token: Token;
  balance: TokenAmount;
}) => {
  const { data: selectedCurrency } = useSelectedCurrency();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
      }}
    >
      <TokenLogoWithChain chainId={chainId} logoURI={token.logoURI} size={42} />
      <StyledText style={{ color: colors.border }}>
        {getCurrencyFormattedValue(balance, selectedCurrency)}
      </StyledText>
    </View>
  );
};

const TokenListItem = ({
  token,
  totalBalance,
  chainBalances,
  onSelect,
}: {
  token: Token;
  totalBalance: TokenAmount | null;
  chainBalances: {
    chainId: number;
    balance: TokenAmount;
  }[];
  onSelect: ({ token, chainId }: { token: Token; chainId: number }) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: selectedCurrency } = useSelectedCurrency();

  const isMultiChain = chainBalances.length > 1;

  return (
    <View
      style={{
        flexDirection: 'column',
        rowGap: 8,
        paddingBottom: isMultiChain ? 8 : 0,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          columnGap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <FeedbackPressable
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            columnGap: 8,
            width: '100%',
          }}
          onPress={() => {
            if (isMultiChain) {
              setIsExpanded(!isExpanded);
            } else {
              onSelect({ token, chainId: chainBalances[0].chainId });
            }
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
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 4,
                }}
              >
                <StyledText>{token.name}</StyledText>
                {token.verified && (
                  <Feather name="check-circle" size={18} color={colors.green} />
                )}
              </View>
              <StyledText style={{ color: colors.border }}>
                {totalBalance
                  ? getCurrencyFormattedValue(totalBalance, selectedCurrency)
                  : ''}
              </StyledText>
            </View>
            {/**
          * 
        <ScrollView horizontal contentContainerStyle={{ columnGap: 16 }}>
          {chainBalances.map((chainBalance, index) => (
            <ChainTokenBalance
              key={index}
              chainId={chainBalance.chainId}
              balance={chainBalance.balance}
            />
          ))}
        </ScrollView>
        */}
          </View>
          {isMultiChain && (
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.border}
            />
          )}
        </FeedbackPressable>
      </View>
      {isExpanded && (
        <View style={{ marginBottom: 32, rowGap: 12 }}>
          {chainBalances.map((b, index) => (
            <FeedbackPressable
              key={index}
              onPress={() => onSelect({ token, chainId: b.chainId })}
            >
              <ChainTokenBalance
                chainId={b.chainId}
                token={token}
                balance={b.balance}
              />
            </FeedbackPressable>
          ))}
        </View>
      )}
    </View>
  );
};

export const SearchInput = ({
  value: _value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) => {
  const { t } = useTranslation(['common']);
  return (
    <BottomSheetTextInput
      placeholder={t('common:searchForToken')}
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
  onSelect,
  onClose,
}: {
  address: Hex | null;
  open: boolean;
  onSelect: ({ token, chainId }: { token: Token; chainId: number }) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation(['common']);
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

  const tokenList = tokenBalancePerAddress
    ? tokenBalancePerAddress.length > 0
      ? tokenBalancePerAddress[0].tokenBalances
      : []
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
            {t('common:noTokensFound')}
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
              totalBalance={item.totalBalance}
              chainBalances={item.chainBalances}
              onSelect={onSelect}
            />
          );
        }}
      />
    </BottomSheetModal>
  );
};

export default SearchInputTokenSheet;
