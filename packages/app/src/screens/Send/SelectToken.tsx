import TokenLogo from '@/components/FastImage/TokenLogo';
import StyledText from '@/components/StyledText/StyledText';
import useTokenBalances from '@/hooks/useTokenBalances';
import colors from '@/lib/styles/colors';
import { RootStackParamsList } from '@/navigation/types';
import { formatAmount, Token } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, View } from 'react-native';

const TokenListItem = ({
  token,
  balance,
  onPress,
}: {
  token: Token;
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
          </View>
          <StyledText style={{ color: colors.border }}>
            {formatAmount(balance.toString(), token.decimals)} {token.symbol}
          </StyledText>
        </View>
      </View>
    </Pressable>
  );
};

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectToken'>;

const SelectToken = ({ navigation, route }: Props) => {
  const address = route.params.address;

  const { data: tokenBalances } = useTokenBalances();

  const onTokenPress = (token: Token) => {
    navigation.navigate('SelectAmount', {
      address,
      token,
    });
  };

  return (
    <View style={{ flex: 1, padding: 16, rowGap: 16 }}>
      <FlatList
        data={tokenBalances}
        contentContainerStyle={{
          rowGap: 16,
        }}
        renderItem={({ item }) => (
          <TokenListItem
            token={item.token}
            balance={item.balance}
            onPress={() => onTokenPress(item.token)}
          />
        )}
      ></FlatList>
    </View>
  );
};

export default SelectToken;
