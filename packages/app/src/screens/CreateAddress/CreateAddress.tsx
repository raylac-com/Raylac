import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useCreateAccount from '@/hooks/useCreateAccoun';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CreateAddress = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const navigation = useTypedNavigation();
  const { mutate: createAccount, isPending: isCreatingAccount } =
    useCreateAccount();

  const onCreatePress = () => {
    createAccount();
    navigation.goBack();
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
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
        isLoading={isCreatingAccount}
      />
    </View>
  );
};

export default CreateAddress;
