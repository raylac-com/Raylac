import StyledButton from '@/components/StyledButton/StyledButton';
import { View } from 'react-native';

const AddAddress = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        rowGap: 16,
        paddingHorizontal: 16,
      }}
    >
      <StyledButton title="Import private key" onPress={() => {}} />
      <StyledButton title="Watch address" onPress={() => {}} />
      <StyledButton title="Create new address" onPress={() => {}} />
    </View>
  );
};

export default AddAddress;
