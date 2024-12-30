import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
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
    await createAccount();
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
          variant="outline"
          icon={<AntDesign name="eyeo" size={24} color={colors.text} />}
        />
        <StyledButton
          title="Import account"
          onPress={() => navigation.navigate('ImportAccount')}
          icon={<Entypo name="key" size={20} color={colors.background} />}
        />
        <StyledButton
          title="Create account"
          isLoading={isCreatingAccount}
          onPress={onCreateAccountPress}
          icon={<AntDesign name="plus" size={20} color={colors.background} />}
        />
      </View>
    </View>
  );
};

export default Start;
