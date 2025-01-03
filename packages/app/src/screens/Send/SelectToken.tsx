import Entypo from '@expo/vector-icons/Entypo';
import TokenLogo from '@/components/FastImage/TokenLogo';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import SendToCard from '@/components/SendToCard/SendToCard';
import StyledText from '@/components/StyledText/StyledText';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';
import useTokenBalances from '@/hooks/useTokenBalances';
import useUserAddresses from '@/hooks/useUserAddresses';
import colors from '@/lib/styles/colors';
import { RootStackParamsList } from '@/navigation/types';
import { TokenAmount, formatTokenAmount, Token } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  ScrollView,
  SectionList,
  TextInput,
  View,
} from 'react-native';
import { Hex } from 'viem';
import BigNumber from 'bignumber.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressType } from '@/types';

const SearchBar = ({
  onAddressSelect,
  selectedAddress,
  onSearchInputChange,
}: {
  onAddressSelect: (address: Hex) => void;
  selectedAddress: Hex | null;
  onSearchInputChange: (text: string) => void;
}) => {
  const { data: userAddresses } = useUserAddresses();

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onKeyboardShow = (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    };

    const onKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener('keyboardWillShow', onKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View
      style={{
        flexDirection: 'column',
        position: 'absolute',
        bottom: keyboardHeight + 32,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        rowGap: 8,
        width: '100%',
      }}
    >
      <ScrollView
        horizontal
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
        }}
      >
        {userAddresses?.map(address => (
          <FeedbackPressable
            onPress={() => onAddressSelect(address.address)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderColor:
                selectedAddress === address.address
                  ? colors.text
                  : colors.border,
              backgroundColor: colors.background,
              borderWidth: selectedAddress === address.address ? 2 : 1,
              borderRadius: 32,
            }}
            key={address.address}
          >
            <WalletIconAddress address={address.address} />
          </FeedbackPressable>
        ))}
      </ScrollView>
      <TextInput
        placeholder="Search"
        autoCorrect={false}
        autoComplete="off"
        onChangeText={onSearchInputChange}
        style={{
          width: '100%',
          height: 56,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 32,
          paddingVertical: 12,
          paddingHorizontal: 22,
          backgroundColor: colors.background,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      />
    </View>
  );
};

const TokenChainItem = ({
  chainId,
  token,
  balance,
}: {
  chainId: number;
  token: Token;
  balance: TokenAmount;
}) => {
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
        {`$${balance.usdValueFormatted}`}
      </StyledText>
    </View>
  );
};

const TokenListItem = ({
  token,
  balance,
  balanceBreakdown,
  onPress,
}: {
  token: Token;
  balance: TokenAmount;
  balanceBreakdown: {
    balance: TokenAmount;
    chainId: number;
  }[];
  onPress: ({ token, chainId }: { token: Token; chainId: number }) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isMultiChain = balanceBreakdown.length > 1;

  return (
    <View
      style={{
        flexDirection: 'column',
        rowGap: 8,
        paddingBottom: balanceBreakdown.length > 0 ? 8 : 0,
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
          onPress={() => {
            if (isMultiChain) {
              setIsExpanded(!isExpanded);
            } else {
              onPress({ token, chainId: balanceBreakdown[0].chainId });
            }
          }}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
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
              </View>
              <StyledText style={{ color: colors.border }}>
                {`$${balance.usdValueFormatted}`}
              </StyledText>
            </View>
          </View>
          {isMultiChain && (
            <Entypo
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.border}
            />
          )}
        </FeedbackPressable>
      </View>
      {isExpanded && (
        <View style={{ marginBottom: 32, rowGap: 12 }}>
          {balanceBreakdown.map((b, index) => (
            <FeedbackPressable
              key={index}
              onPress={() => onPress({ token, chainId: b.chainId })}
            >
              <TokenChainItem
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

type AddressTokenBalances = {
  address: Hex;
  tokenBalances: {
    token: Token;
    totalBalance: TokenAmount;
    chainBalances: {
      chainId: number;
      balance: TokenAmount;
    }[];
  }[];
};

const useTokenBalancePerAddress = ({
  addresses,
}: {
  addresses: Hex[];
}): AddressTokenBalances[] | undefined => {
  const { data: tokenBalances } = useTokenBalances();

  const tokenBalancesPerAddress: AddressTokenBalances[] = [];

  if (tokenBalances && addresses) {
    for (const address of addresses) {
      const addressTokenBalances = tokenBalances.filter(
        balance => balance.address === address
      );

      // Group by token
      const addressTokenIds = [
        ...new Set(addressTokenBalances.map(balance => balance.token.id)),
      ];

      const groupByTokens = [];

      for (const tokenId of addressTokenIds) {
        const tokenBalances = addressTokenBalances.filter(
          balance => balance.token.id === tokenId
        );

        const totalBalance = tokenBalances.reduce(
          (acc, balance) => acc + BigInt(balance.balance.amount),
          BigInt(0)
        );

        const formattedTotalBalance = formatTokenAmount({
          amount: totalBalance,
          token: tokenBalances[0].token,
          tokenPriceUsd: tokenBalances[0].balance.tokenPriceUsd,
        });

        groupByTokens.push({
          token: tokenBalances[0].token,
          totalBalance: formattedTotalBalance,
          chainBalances: tokenBalances.map(balance => ({
            chainId: balance.chainId,
            balance: balance.balance,
          })),
        });
      }

      const sortedGroupByTokens = groupByTokens.sort((a, b) => {
        if (a.token.addresses.length > b.token.addresses.length) {
          return -1;
        }

        if (a.token.addresses.length < b.token.addresses.length) {
          return 1;
        }

        if (
          new BigNumber(a.totalBalance.usdValue).gt(b.totalBalance.usdValue)
        ) {
          return -1;
        } else {
          return 1;
        }
      });

      tokenBalancesPerAddress.push({
        address,
        tokenBalances: sortedGroupByTokens,
      });
    }
  }

  const sortedTokenBalancesPerAddress = tokenBalancesPerAddress.sort((a, b) => {
    return b.tokenBalances.length - a.tokenBalances.length;
  });

  return sortedTokenBalancesPerAddress;
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectToken'>;

const SelectToken = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const toAddress = route.params.toAddress;
  const { data: userAddresses } = useUserAddresses();

  const [selectedAddress, setSelectedAddress] = useState<Hex | null>(null);
  const [searchText, setSearchText] = useState('');

  const tokenBalancesPerAddress = useTokenBalancePerAddress({
    addresses: selectedAddress
      ? [selectedAddress]
      : (userAddresses
          ?.filter(a => a.type !== AddressType.Watch)
          .map(a => a.address) ?? []),
  });

  const onTokenSelect = ({
    token,
    address,
    chainId,
  }: {
    token: Token;
    address: Hex;
    chainId: number;
  }) => {
    navigation.navigate('SelectAmount', {
      toAddress,
      fromAddresses: [address],
      token,
      chainId,
    });
  };

  const onAddressSelect = (address: Hex) => {
    setSelectedAddress(address);
  };

  const onSearchInputChange = (text: string) => {
    setSearchText(text);
  };

  const filteredTokenBalancesPerAddress = useMemo(() => {
    return tokenBalancesPerAddress?.map(a => ({
      ...a,
      tokenBalances: a.tokenBalances.filter(
        b =>
          b.token.name.toLowerCase().includes(searchText.toLowerCase()) ||
          b.token.symbol.toLowerCase().includes(searchText.toLowerCase())
      ),
    }));
  }, [tokenBalancesPerAddress, searchText]);

  return (
    <View
      style={{
        flex: 1,
        position: 'relative',
        paddingBottom: insets.bottom,
      }}
    >
      <View style={{ padding: 16 }}>
        <SendToCard toAddress={toAddress} />
      </View>
      <SectionList
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{
          rowGap: 8,
        }}
        scrollEnabled
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <StyledText>{`No tokens found`}</StyledText>
          </View>
        }
        sections={
          filteredTokenBalancesPerAddress?.map(a => ({
            title: a.address,
            data: a.tokenBalances,
          })) ?? []
        }
        keyExtractor={(item, index) => `${item.token.addresses[0]}-${index}`}
        renderSectionHeader={({ section }) => (
          <View style={{ height: 32 }}>
            <WalletIconAddress address={section.title} />
          </View>
        )}
        renderItem={({ item: tokenBalance, section }) => {
          return (
            <TokenListItem
              token={tokenBalance.token}
              balance={tokenBalance.totalBalance}
              balanceBreakdown={tokenBalance.chainBalances}
              onPress={({ token, chainId }) =>
                onTokenSelect({ address: section.title, token, chainId })
              }
            />
          );
        }}
        stickySectionHeadersEnabled={false}
      />
      <SearchBar
        selectedAddress={selectedAddress}
        onAddressSelect={onAddressSelect}
        onSearchInputChange={onSearchInputChange}
      />
    </View>
  );
};

export default SelectToken;
