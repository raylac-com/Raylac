import { View } from 'react-native';
import StyledButton from '@/components/StyledButton/StyledButton';
import useCreateAccount from '@/hooks/useCreateAccoun';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { sleep } from '@raylac/shared';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

const Start = () => {
  const insets = useSafeAreaInsets();

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
        justifyContent: 'space-between',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 16,
        rowGap: 8,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../../assets/icon.png')}
          style={{ width: 200, height: 200 }}
        />
      </View>
      <View style={{ flexDirection: 'column', rowGap: 8 }}>
        <StyledButton
          title="Watch address"
          onPress={() => navigation.navigate('StartWatch')}
        />
        <StyledButton
          title="Import account"
          onPress={() => navigation.navigate('ImportAccount')}
          disabled
        />
        <StyledButton
          title="Create Account"
          isLoading={isCreatingAccount}
          onPress={onCreateAccountPress}
          disabled
        />
      </View>
    </View>
  );
};

export default Start;
