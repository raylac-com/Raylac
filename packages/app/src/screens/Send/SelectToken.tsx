import TokenLogo from '@/components/FastImage/TokenLogo';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import StyledText from '@/components/StyledText/StyledText';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import WalletIconAddress from '@/components/WalletIconAddress/WalletIconAddress';
import useUserAddresses from '@/hooks/useUserAddresses';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import { Balance, getAddressTokenBalances, Token } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
        paddingLeft: 12,
      }}
    >
      <TokenLogoWithChain chainId={chainId} logoURI={token.logoURI} size={32} />
      <StyledText style={{ color: colors.border }}>
        {`$${balance.usdValue}`}
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
              {`$${balance.usdValue}`}
            </StyledText>
          </View>
        </View>
      </View>
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
  );
};

const useTokenAddressPerAddress = () => {
  const { data: userAddresses } = useUserAddresses();

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery({
    addresses: userAddresses?.map(a => a.address) ?? [],
  });

  const addressTokenBalances = userAddresses?.map(a => ({
    address: a.address,
    tokenBalances: getAddressTokenBalances({
      tokenBalances: tokenBalances ?? [],
      address: a.address,
    }),
  }));

  return addressTokenBalances;
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectToken'>;

const SelectToken = ({ navigation, route }: Props) => {
  const toAddress = route.params.toAddress;

  const addressTokenBalances = useTokenAddressPerAddress();

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
    <SectionList
      contentContainerStyle={{
        padding: 16,
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
      SectionSeparatorComponent={() => {
        return <View style={{ height: 16 }} />;
      }}
      sections={
        addressTokenBalances?.map(a => ({
          title: a.address,
          data: a.tokenBalances,
        })) ?? []
      }
      keyExtractor={(item, index) => `${item.token.symbol}-${index}`}
      renderSectionHeader={({ section }) => (
        <WalletIconAddress address={section.title} />
      )}
      renderItem={({ item: tokenBalance }) => (
        <TokenListItem
          token={tokenBalance.token}
          balance={tokenBalance.balance}
          balanceBreakdown={tokenBalance.breakdown}
          onPress={({ token, chainId }) =>
            onTokenSelect({ address: tokenBalance.address, token, chainId })
          }
        />
      )}
      stickySectionHeadersEnabled={false}
    />
  );
};

export default SelectToken;
