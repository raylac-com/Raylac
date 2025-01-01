import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MoveFundsSheetStackParamsList } from '../MoveFundsSheet';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMoveFundsContext } from '@/contexts/MoveFundsContext';

const MoveComplete = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MoveFundsSheetStackParamsList>>();

  const { reset } = useMoveFundsContext();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <StyledText>{`Move Complete`}</StyledText>
      <StyledButton
        title={`Done`}
        onPress={() => {
          reset();
          navigation.navigate('MoveFunds');
        }}
      ></StyledButton>
    </View>
  );
};

export default MoveComplete;
