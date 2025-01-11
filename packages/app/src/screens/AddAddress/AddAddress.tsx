import StyledButton from '@/components/StyledButton/StyledButton';
import colors from '@/lib/styles/colors';
import { Feather } from '@expo/vector-icons';
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
      <StyledButton
        icon={<Feather name="key" size={20} color={colors.background} />}
        title="Import account"
        onPress={onImportPrivKeyPress}
      />
      <StyledButton
        icon={<Feather name="eye" size={20} color={colors.background} />}
        title="Watch address"
        onPress={onWatchAddressPress}
      />
      <StyledButton
        icon={<Feather name="plus" size={20} color={colors.background} />}
        title="Create address"
        onPress={onCreateAddressPress}
      />
    </View>
  );
};

export default AddAddress;
