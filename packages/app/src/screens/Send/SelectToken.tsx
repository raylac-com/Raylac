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
import { Balance, formatBalance, getTokenId, Token } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { SectionList, View } from 'react-native';
import { Hex } from 'viem';

const TokenChainItem = ({
  chainId,
  token,
  balance,
}: {
  chainId: number;
  token: Token;
  balance: Balance;
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
  balance: Balance;
  balanceBreakdown: {
    balance: Balance;
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
    totalBalance: Balance;
    chainBalances: {
      chainId: number;
      balance: Balance;
    }[];
  }[];
};

const useTokenBalancePerAddress = (): AddressTokenBalances[] | undefined => {
  const { data: tokenBalances } = useTokenBalances();
  const { data: userAddresses } = useUserAddresses();

  const tokenBalancesPerAddress: AddressTokenBalances[] = [];

  if (tokenBalances && userAddresses) {
    for (const address of userAddresses) {
      const addressTokenBalances = tokenBalances.filter(
        balance => balance.address === address.address
      );

      // Group by tokne
      const addressTokenIds = [
        ...new Set(
          addressTokenBalances.map(balance => getTokenId(balance.token))
        ),
      ];

      const groupByTokens = [];

      for (const tokenId of addressTokenIds) {
        const tokenBalances = addressTokenBalances.filter(
          balance => getTokenId(balance.token) === tokenId
        );

        const totalBalance = tokenBalances.reduce(
          (acc, balance) => acc + BigInt(balance.balance.balance),
          BigInt(0)
        );

        const formattedTotalBalance = formatBalance({
          balance: totalBalance,
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

      tokenBalancesPerAddress.push({
        address: address.address,
        tokenBalances: groupByTokens,
      });
    }
  }

  return tokenBalancesPerAddress;
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectToken'>;

const SelectToken = ({ navigation, route }: Props) => {
  const toAddress = route.params.toAddress;

  const tokenBalancesPerAddress = useTokenBalancePerAddress();

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

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <SendToCard toAddress={toAddress} />
      </View>
      <SectionList
        contentContainerStyle={{
          padding: 16,
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
          tokenBalancesPerAddress?.map(a => ({
            title: a.address,
            data: a.tokenBalances,
          })) ?? []
        }
        keyExtractor={(item, index) => `${item.token.symbol}-${index}`}
        renderSectionHeader={({ section }) => (
          <WalletIconAddress address={section.title} />
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
    </View>
  );
};

export default SelectToken;
