import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';
import StyledButton from '@/components/StyledButton/StyledButton';
//import useCreateAccount from '@/hooks/useCreateAccoun';
import useTypedNavigation from '@/hooks/useTypedNavigation';
//import { sleep } from '@raylac/shared';
//import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import useCreateAccount from '@/hooks/useCreateAccoun';
import colors from '@/lib/styles/colors';

const Start = () => {
  const insets = useSafeAreaInsets();

  const navigation = useTypedNavigation();

  const { mutateAsync: createAccount, isPending: isCreatingAccount } =
    useCreateAccount();

  const onCreateAccountPress = async () => {
    const address = await createAccount();
    navigation.navigate('SaveBackupPhrase', {
      genesisAddress: address,
    });
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 32,
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
          variant="outline"
          icon={<Feather name="eye" size={24} color={colors.text} />}
        />
        <StyledButton
          title="Import account"
          onPress={() => navigation.navigate('ImportAccount')}
          icon={<Feather name="key" size={20} color={colors.background} />}
        />
        <StyledButton
          title="Create account"
          isLoading={isCreatingAccount}
          onPress={onCreateAccountPress}
          icon={<Feather name="plus" size={20} color={colors.background} />}
        />
      </View>
    </View>
  );
};

export default Start;
