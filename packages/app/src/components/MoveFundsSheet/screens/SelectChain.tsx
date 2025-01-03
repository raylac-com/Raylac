import { getChainFromId, supportedChains, Token } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, View } from 'react-native';
import { MoveFundsSheetStackParamsList } from '../MoveFundsSheet';
import StyledText from '@/components/StyledText/StyledText';
import TokenLogoWithChain from '@/components/TokenLogoWithChain/TokenLogoWithChain';
import colors from '@/lib/styles/colors';
import { useNavigation } from '@react-navigation/native';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import { useMoveFundsContext } from '@/contexts/MoveFundsContext';

const ChainListItem = ({
  chainId,
  token,
  onPress,
}: {
  chainId: number;
  token: Token;
  onPress: () => void;
}) => {
  return (
    <FeedbackPressable
      style={{ flexDirection: 'row', alignItems: 'center' }}
      onPress={onPress}
    >
      <TokenLogoWithChain chainId={chainId} logoURI={token.logoURI} size={24} />
      <StyledText
        style={{
          color: colors.subbedText,
        }}
      >
        {getChainFromId(chainId).name}
      </StyledText>
    </FeedbackPressable>
  );
};

type Props = Pick<
  NativeStackScreenProps<MoveFundsSheetStackParamsList, 'SelectChain'>,
  'route'
>;

const SelectChain = ({ route }: Props) => {
  const { type } = route.params;
  const { token, setFromChainId, setToChainId } = useMoveFundsContext();

  const navigation = useNavigation();

  const onChainSelect = ({ chainId }: { chainId: number }) => {
    if (type === 'from') {
      setFromChainId(chainId);
    } else {
      setToChainId(chainId);
    }
    navigation.goBack();
  };

  if (!token) {
    throw new Error('Token is required');
  }

  return (
    <View>
      <FlatList
        data={supportedChains}
        renderItem={({ item }) => (
          <ChainListItem
            chainId={item.id}
            token={token}
            onPress={() =>
              onChainSelect({
                chainId: item.id,
              })
            }
          />
        )}
      />
    </View>
  );
};

export default SelectChain;
