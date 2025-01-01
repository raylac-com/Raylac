import StyledText from '@/components/StyledText/StyledText';
import { useMoveFundsContext } from '@/contexts/MoveFundsContext';
import useUserAddresses from '@/hooks/useUserAddresses';
import { shortenAddress } from '@/lib/utils';
import { FlatList, View } from 'react-native';
import { Hex } from 'viem';
import { MoveFundsSheetStackParamsList } from '../MoveFundsSheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import { useNavigation } from '@react-navigation/native';

const AddressListItem = ({
  address,
  onPress,
}: {
  address: Hex;
  onPress: () => void;
}) => {
  return (
    <FeedbackPressable onPress={onPress}>
      <StyledText>{shortenAddress(address)}</StyledText>
    </FeedbackPressable>
  );
};

type Props = Pick<
  NativeStackScreenProps<MoveFundsSheetStackParamsList, 'SelectAddress'>,
  'route'
>;

const SelectAddress = ({ route }: Props) => {
  const { type } = route.params;
  const { data: userAddresses } = useUserAddresses();
  const { setFromAddress, setToAddress } = useMoveFundsContext();

  const navigation = useNavigation();

  const onAddressPress = (address: Hex) => {
    if (type === 'from') {
      setFromAddress(address);
    } else {
      setToAddress(address);
    }

    navigation.goBack();
  };

  return (
    <View>
      <FlatList
        data={userAddresses}
        renderItem={({ item }) => (
          <AddressListItem
            address={item.address}
            onPress={() => onAddressPress(item.address)}
          />
        )}
      />
    </View>
  );
};

export default SelectAddress;
