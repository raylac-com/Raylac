import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import TokenLogo from '@/components/TokenLogo/TokenLogo';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import SendToCard from '@/components/SendToCard/SendToCard';
import StyledText from '@/components/StyledText/StyledText';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';
import colors from '@/lib/styles/colors';
import { RootStackParamsList } from '@/navigation/types';
import { TokenAmount, Token } from '@raylac/shared';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTokenBalancePerAddress from '@/hooks/useTokenBalancePerAddress';
import useWriterAddresses from '@/hooks/useWriterAddresses';
import SearchInputAccessory from '@/components/SearchInputAccessory/SearchInputAccessory';
import {
  withTiming,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

const SearchBar = ({
  onAddressSelect,
  selectedAddress,
  onSearchInputChange,
  searchText,
}: {
  onAddressSelect: (address: Hex) => void;
  selectedAddress: Hex | null;
  onSearchInputChange: (text: string) => void;
  searchText: string;
}) => {
  const { data: writerAddresses } = useWriterAddresses();

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
        {writerAddresses?.map(address => (
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
        autoCapitalize="none"
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
        value={searchText}
        inputAccessoryViewID={'test'}
      />
      <SearchInputAccessory
        onClear={() => onSearchInputChange('')}
        onPaste={async () =>
          onSearchInputChange(await Clipboard.getStringAsync())
        }
        inputAccessoryViewID={'test'}
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
  const heightAnimation = useSharedValue(0);

  const isMultiChain = balanceBreakdown.length > 1;

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: heightAnimation.value,
      rowGap: 12,
      overflow: 'hidden',
    };
  });

  useEffect(() => {
    if (isExpanded) {
      heightAnimation.value = withTiming(balanceBreakdown.length * 60, {
        duration: 200,
      });
    } else {
      heightAnimation.value = withTiming(0, {
        duration: 200,
      });
    }
  }, [isExpanded, balanceBreakdown.length]);

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
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.border}
            />
          )}
        </FeedbackPressable>
      </View>
      <Animated.View style={animatedStyles}>
        {balanceBreakdown.map((b, index) => (
          <FeedbackPressable
            onPress={() => onPress({ token, chainId: b.chainId })}
            key={index}
          >
            <TokenChainItem
              chainId={b.chainId}
              token={token}
              balance={b.balance}
            />
          </FeedbackPressable>
        ))}
      </Animated.View>
    </View>
  );
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectToken'>;

const SelectToken = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const toAddress = route.params.toAddress;
  const { data: writerAddresses } = useWriterAddresses();

  const [selectedAddress, setSelectedAddress] = useState<Hex | null>(null);
  const [searchText, setSearchText] = useState('');

  const tokenBalancesPerAddress = useTokenBalancePerAddress({
    addresses: selectedAddress
      ? [selectedAddress]
      : (writerAddresses?.map(a => a.address) ?? []),
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
      <SectionList
        style={{
          flex: 1,
          padding: 16,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: 32 }}>
            <SendToCard toAddress={toAddress} />
          </View>
        }
        contentContainerStyle={{
          paddingBottom: 120,
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
        searchText={searchText}
        selectedAddress={selectedAddress}
        onAddressSelect={onAddressSelect}
        onSearchInputChange={onSearchInputChange}
      />
    </View>
  );
};

export default SelectToken;
