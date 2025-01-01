import useUserAddresses from '@/hooks/useUserAddresses';
import { trpc } from '@/lib/trpc';
import { Token } from '@raylac/shared';
import { getAddressTokenBalances } from '@raylac/shared/src/utils';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, View } from 'react-native';
import { zeroAddress } from 'viem';
import { MoveFundsSheetStackParamsList } from '../MoveFundsSheet';
import StyledText from '@/components/StyledText/StyledText';
import colors from '@/lib/styles/colors';
import { useNavigation } from '@react-navigation/native';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import TokenLogo from '@/components/FastImage/TokenLogo';
import { useMoveFundsContext } from '@/contexts/MoveFundsContext';

const TokenListItem = ({
  token,
  onPress,
}: {
  token: Token;
  onPress: () => void;
}) => {
  return (
    <FeedbackPressable
      style={{ flexDirection: 'row', alignItems: 'center' }}
      onPress={onPress}
    >
      <TokenLogo
        source={{ uri: token.logoURI }}
        style={{ width: 24, height: 24 }}
      />
      <StyledText
        style={{
          color: colors.subbedText,
        }}
      >
        {token.symbol}
      </StyledText>
    </FeedbackPressable>
  );
};

const SelectToken = () => {
  const { setToken, fromAddress } = useMoveFundsContext();

  const { data: userAddresses } = useUserAddresses();
  const { data: tokenBalances } = trpc.getTokenBalances.useQuery({
    addresses: userAddresses?.map(address => address.address) ?? [],
  });

  const navigation =
    useNavigation<NativeStackNavigationProp<MoveFundsSheetStackParamsList>>();

  const addressTokenBalances = getAddressTokenBalances({
    tokenBalances: tokenBalances ?? [],
    address: fromAddress ?? zeroAddress,
  });

  const onTokenSelect = ({ token }: { token: Token }) => {
    setToken(token);
    navigation.goBack();
  };

  if (fromAddress === null) {
    throw new Error('fromAddress is null');
  }

  return (
    <View>
      <FlatList
        data={addressTokenBalances}
        renderItem={({ item }) => (
          <TokenListItem
            token={item.token}
            onPress={() => onTokenSelect({ token: item.token })}
          />
        )}
      />
    </View>
  );
};

export default SelectToken;
