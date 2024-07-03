import { View } from 'react-native';
import StyledButton from '@/components/StyledButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SendStackParamsList } from '@/navigation/types';

type Props = NativeStackScreenProps<SendStackParamsList, 'Send'>;

const SelectSend = ({ navigation }: Props) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        rowGap: 24,
      }}
    >
      <StyledButton
        title="Send to a Sutori user"
        onPress={() => navigation.navigate("SendToSutoriUser")}
      ></StyledButton>
      <StyledButton
        title="Send to a non-Sutori user"
        onPress={() => navigation.navigate('SendToNonSutoriUser')}
      ></StyledButton>
    </View>
  );
};

export default SelectSend;
