import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { View } from 'react-native';

const AddAddress = () => {
  const navigation = useTypedNavigation();

  const onImportPrivKeyPress = () => {
    navigation.navigate('ImportAccount');
  };
  const onWatchAddressPress = () => {
    navigation.navigate('StartWatch');
  };
  const onCreateAddressPress = () => {
    navigation.navigate('CreateAddress');
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        rowGap: 16,
        paddingHorizontal: 16,
      }}
    >
      <StyledButton title="Import private key" onPress={onImportPrivKeyPress} />
      <StyledButton title="Watch address" onPress={onWatchAddressPress} />
      <StyledButton title="Create new address" onPress={onCreateAddressPress} />
    </View>
  );
};

export default AddAddress;
