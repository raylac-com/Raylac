import StyledButton from '@/components/StyledButton/StyledButton';
import useCreateAccount from '@/hooks/useCreateAccoun';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { sleep } from '@raylac/shared';
import { useState } from 'react';
import { View } from 'react-native';

const Start = () => {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const navigation = useTypedNavigation();

  const { mutateAsync: createAccount } = useCreateAccount();

  const onCreateAccountPress = async () => {
    setIsCreatingAccount(true);
    await sleep(300);
    await createAccount();
    setIsCreatingAccount(false);
    navigation.navigate('SaveBackupPhrase');
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 16,
        rowGap: 8,
      }}
    >
      <StyledButton
        title="I already have an account"
        onPress={() => navigation.navigate('ImportAccount')}
      />
      <StyledButton
        title="Create Account"
        isLoading={isCreatingAccount}
        onPress={onCreateAccountPress}
      />
    </View>
  );
};

export default Start;
