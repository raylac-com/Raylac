import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useDeriveAddress from '@/hooks/useDeriveAddress';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { getGenesisAddress } from '@/lib/key';
import colors from '@/lib/styles/colors';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CreateAddress = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const navigation = useTypedNavigation();
  const { mutateAsync: deriveAddress, isPending: isDerivingAddress } =
    useDeriveAddress();

  const onCreatePress = async () => {
    const genesisAddress = await getGenesisAddress();

    // TODO Create a mnemonic group if there are no mnemonic addresses

    await deriveAddress(genesisAddress);

    navigation.goBack();
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 16,
      }}
    >
      <View>
        <StyledText>{`Name`}</StyledText>
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus={true}
          style={{
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            paddingHorizontal: 22,
            paddingVertical: 20,
          }}
        />
      </View>
      <StyledButton
        title="Create"
        onPress={onCreatePress}
        isLoading={isDerivingAddress}
      />
    </View>
  );
};

export default CreateAddress;
