import FastAvatar from '@/components/FastAvatar';
import useSignOut from '@/hooks/useSignOut';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { deleteMnemonic } from '@/lib/key';
import { theme } from '@/lib/theme';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, TouchableHighlight, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Entypo } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';

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
        height: 60,
      }}
      onPress={onPress}
      underlayColor={theme.backgroundHover}
    >
      <View
        style={{
          width: '100%',
          height: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 36,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <View
            style={{
              width: 20,
            }}
          >
            {icon}
          </View>
          <Text
            style={{
              marginLeft: 24,
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

  const onChangeLanguagePress = useCallback(() => {
    navigation.navigate('SelectLanguage');
  }, []);

  const onDeletePress = useCallback(async () => {
    Alert.alert('Delete account', '', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          await signOut();
          await deleteMnemonic();
          navigation.navigate('Start');
        },
        style: 'destructive',
      },
    ]);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 24,
      }}
    >
      {user ? (
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <FastAvatar
            address={publicKeyToAddress(user.spendingPubKey as Hex)}
            size={50}
          ></FastAvatar>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 12,
            }}
            onPress={() => navigation.navigate('UpdateDisplayName')}
          >
            <Text
              style={{
                fontSize: 24,
                color: theme.text,
              }}
            >
              {user.name}
            </Text>
            <AntDesign
              name="edit"
              size={22}
              color={theme.gray}
              style={{
                marginLeft: 4,
                marginRight: -12,
              }}
            />
          </Pressable>
          <Text
            style={{
              marginTop: 4,
              opacity: 0.5,
              color: theme.text,
            }}
          >
            @{user.username}
          </Text>
        </View>
      ) : null}
      <View
        style={{
          width: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 24,
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
          icon={<Entypo name="language" size={24} color={theme.gray} />}
          title={t('language')}
          onPress={onChangeLanguagePress}
          color={theme.text}
        />
        <SettingListItem
          icon={<MaterialIcons name="logout" size={24} color={theme.waning} />}
          title={t('signOut')}
          onPress={onSignOutPress}
          color={theme.waning}
        />
      </View>
      <View
        style={{
          marginTop: 40,
        }}
      >
        <Text
          onPress={onDeletePress}
          style={{
            color: theme.waning,
            opacity: 0.6,
          }}
        >
          delete account
        </Text>
      </View>
    </View>
  );
};

export default Account;
