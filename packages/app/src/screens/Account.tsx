import FastAvatar from '@/components/FastAvatar';
import useSignOut from '@/hooks/useSignOut';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { theme } from '@/lib/theme';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, TouchableHighlight, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Entypo } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import useSetProfileImage from '@/hooks/useSetProfileImage';

interface SettingListItemProps {
  isFirst?: boolean;
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  color: string;
}

const SettingListItem = (props: SettingListItemProps) => {
  const { icon, title, onPress, color } = props;

  return (
    <TouchableHighlight
      style={{
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
      }}
      onPress={onPress}
      underlayColor={theme.backgroundHover}
    >
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 30,
            }}
          >
            {icon}
          </View>
          <Text
            style={{
              marginLeft: 10,
              fontSize: 16,
              textAlign: 'center',
              fontWeight: '500',
              color: color ? color : theme.text,
            }}
          >
            {title}
          </Text>
        </View>
        <Entypo
          name="chevron-right"
          size={18}
          color={theme.text}
          style={{
            opacity: 0.7,
          }}
        />
      </View>
    </TouchableHighlight>
  );
};

const Account = () => {
  const { data: user } = useSignedInUser();
  const { mutateAsync: signOut } = useSignOut();
  const navigation = useTypedNavigation();
  const { t } = useTranslation('Account');
  const { mutateAsync: setProfileImage } = useSetProfileImage();

  const onSignOutPress = useCallback(async () => {
    Alert.alert(t('confirmSignOutTitle'), '', [
      {
        text: t('cancel'),
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: t('confirmSignOut'),
        onPress: async () => {
          await signOut();
          navigation.navigate('Start');
        },
        style: 'destructive',
      },
    ]);
  }, [signOut, navigation]);

  if (!user) {
    return null;
  }

  /*
  const onChangeLanguagePress = useCallback(() => {
    navigation.navigate('SelectLanguage');
  }, []);
  */

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          rowGap: 8,
        }}
      >
        <View
          style={{
            position: 'relative',
            width: 64,
            height: 64,
          }}
        >
          <FastAvatar
            address={publicKeyToAddress(user.spendingPubKey as Hex)}
            size={64}
            imageUrl={user.profileImage}
          ></FastAvatar>
          <AntDesign
            name="camera"
            size={20}
            color={theme.text}
            style={{
              opacity: 0.9,
              right: 22,
              bottom: 22,
              position: 'absolute',
            }}
            onPress={() => {
              setProfileImage();
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 24,
            color: theme.text,
          }}
        >
          {user.name}
        </Text>
        <Text
          style={{
            opacity: 0.5,
            color: theme.text,
          }}
        >
          @{user.username}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 40,
        }}
      >
        <SettingListItem
          isFirst
          icon={
            <MaterialIcons name="account-circle" size={24} color={theme.gray} />
          }
          title={t('accountInfo')}
          onPress={() => navigation.navigate('AccountInfo')}
          color={theme.text}
        />
        <SettingListItem
          isFirst
          icon={<MaterialIcons name="backup" size={24} color={theme.gray} />}
          title={t('backupAccount')}
          onPress={() => navigation.navigate('BackupAccount')}
          color={theme.text}
        />
        <SettingListItem
          isFirst
          icon={<MaterialIcons name="list" size={24} color={theme.gray} />}
          title={t('addresses')}
          onPress={() => navigation.navigate('Addresses')}
          color={theme.text}
        />
        {/**
           * 
          
        <SettingListItem
          icon={<Entypo name="language" size={24} color={theme.gray} />}
          title={t('language')}
          onPress={onChangeLanguagePress}
          color={theme.text}
        />
         */}
        <SettingListItem
          icon={<MaterialIcons name="logout" size={24} color={theme.waning} />}
          title={t('signOut')}
          onPress={onSignOutPress}
          color={theme.waning}
        />
      </View>
    </View>
  );
};

export default Account;
