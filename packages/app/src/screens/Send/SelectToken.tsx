import TokenLogo from '@/components/FastImage/TokenLogo';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import StyledText from '@/components/StyledText/StyledText';
import useUserAddresses from '@/hooks/useUserAddresses';
import colors from '@/lib/styles/colors';
import { trpc } from '@/lib/trpc';
import { RootStackParamsList } from '@/navigation/types';
import {
  formatAmount,
  getAddressTokenBalances,
  getChainName,
  Token,
} from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, View } from 'react-native';
import { Hex } from 'viem';

const TokenListItem = ({
  token,
  balance,
  balanceBreakdown,
  onPress,
}: {
  token: Token;
  balance: bigint;
  balanceBreakdown: {
    balance: bigint;
    chainId: number;
  }[];
  onPress: ({ token, chainId }: { token: Token; chainId: number }) => void;
}) => {
  return (
    <View
      style={{
        flexDirection: 'column',
        rowGap: 8,
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
              {formatAmount(balance.toString(), token.decimals)} {token.symbol}
            </StyledText>
          </View>
        </View>
      </View>
      {balanceBreakdown.map((b, index) => (
        <FeedbackPressable
          key={index}
          onPress={() => onPress({ token, chainId: b.chainId })}
        >
          <StyledText>{getChainName(b.chainId)}</StyledText>
          <StyledText>
            {formatAmount(b.balance.toString(), token.decimals)}
          </StyledText>
        </FeedbackPressable>
      ))}
    </View>
  );
};

const AddressCard = ({
  address,
  onPress,
}: {
  address: Hex;
  onPress: ({ token, chainId }: { token: Token; chainId: number }) => void;
}) => {
  const { data: userAddresses } = useUserAddresses();

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery({
    addresses: userAddresses?.map(a => a.address) ?? [],
  });

  const addressTokenBalances = getAddressTokenBalances({
    tokenBalances: tokenBalances ?? [],
    address,
  });

  return (
    <View style={{ flexDirection: 'column', rowGap: 8 }}>
      <StyledText>{address}</StyledText>
      {addressTokenBalances.map((tb, index) => (
        <TokenListItem
          key={index}
          token={tb.token}
          balance={tb.totalBalance}
          balanceBreakdown={tb.breakdown}
          onPress={onPress}
        />
      ))}
    </View>
  );
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectToken'>;

const SelectToken = ({ navigation, route }: Props) => {
  const toAddress = route.params.toAddress;

  const { data: userAddresses } = useUserAddresses();

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
    <View style={{ flex: 1, padding: 16, rowGap: 16 }}>
      <FlatList
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
        data={userAddresses}
        contentContainerStyle={{
          rowGap: 16,
        }}
        renderItem={({ item }) => (
          <AddressCard
            address={item.address}
            onPress={({ token, chainId }) =>
              onTokenSelect({ address: item.address, token, chainId })
            }
          />
        )}
      ></FlatList>
    </View>
  );
};

export default SelectToken;
