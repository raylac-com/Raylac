import FastAvatar from '@/components/FastAvatar';
import useSignOut from '@/hooks/useSignOut';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, TouchableHighlight, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Entypo, FontAwesome5 } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import useSetProfileImage from '@/hooks/useSetProfileImage';
import Toast from 'react-native-toast-message';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import opacity from '@/lib/styles/opacity';

interface SettingListItemProps {
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
              marginLeft: spacing.small,
              fontSize: fontSizes.base,
              textAlign: 'center',
              fontWeight: '500',
              color: color ? color : colors.text,
            }}
          >
            {title}
          </Text>
        </View>
        <Entypo
          name="chevron-right"
          size={fontSizes.base}
          color={colors.text}
          a
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
  const {
    mutateAsync: setProfileImage,
    isPending: isSettingProfileImage,
    status: setProfileImageStatus,
    reset: resetSetProfileImage,
  } = useSetProfileImage();

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

  useEffect(() => {
    if (isSettingProfileImage) {
      Toast.show({
        type: 'info',
        text1: 'Uploading profile image...',
        autoHide: false,
      });
    }

    if (!isSettingProfileImage) {
      Toast.hide();
      resetSetProfileImage();
    }
  }, [isSettingProfileImage]);

  useEffect(() => {
    if (setProfileImageStatus === 'error') {
      Toast.show({
        type: 'error',
        text1: 'Failed to upload profile image',
      });
    }
  }, [setProfileImageStatus]);

  if (!user) {
    return null;
  }

  const onChangeLanguagePress = useCallback(() => {
    navigation.navigate('SelectLanguage');
  }, []);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        padding: spacing.base,
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
            name={user.name}
            address={publicKeyToAddress(user.spendingPubKey as Hex)}
            size={64}
            imageUrl={user.profileImage}
          ></FastAvatar>
          <AntDesign
            name="camera"
            size={20}
            color={colors.text}
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
            fontSize: fontSizes.large,
            color: colors.text,
          }}
        >
          {user.name}
        </Text>
        <Text
          style={{
            opacity: opacity.dimmed,
            color: colors.text,
          }}
          // eslint-disable-next-line react/jsx-no-literals
        >
          @{user.username}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: spacing.base,
        }}
      >
        <SettingListItem
          icon={
            <FontAwesome5
              name="feather-alt"
              size={20}
              color={colors.angelPink}
            />
          }
          title={t('angelTransfer')}
          onPress={() => navigation.navigate('SelectAngelRequest')}
          color={colors.angelPink}
        />
        <SettingListItem
          icon={
            <MaterialIcons
              name="account-circle"
              size={24}
              color={colors.gray}
            />
          }
          title={t('accountInfo')}
          onPress={() => navigation.navigate('AccountInfo')}
          color={colors.text}
        />
        <SettingListItem
          icon={
            <FontAwesome5
              name="feather-alt"
              size={20}
              color={colors.angelPink}
            />
          }
          title={t('userAngelRequests')}
          onPress={() => navigation.navigate('UserAngelRequests')}
          color={colors.text}
        />
        <SettingListItem
          icon={<MaterialIcons name="backup" size={24} color={colors.gray} />}
          title={t('backupAccount')}
          onPress={() => navigation.navigate('BackupAccount')}
          color={colors.text}
        />
        <SettingListItem
          icon={<MaterialIcons name="list" size={24} color={colors.gray} />}
          title={t('addresses')}
          onPress={() => navigation.navigate('Addresses')}
          color={colors.text}
        />
        <SettingListItem
          icon={<MaterialIcons name="settings" size={24} color={colors.gray} />}
          title={t('advanced')}
          onPress={() => navigation.navigate('Advanced')}
          color={colors.text}
        />
        <SettingListItem
          icon={<Entypo name="language" size={24} color={colors.gray} />}
          title={t('language')}
          onPress={onChangeLanguagePress}
          color={colors.text}
        />
        <SettingListItem
          icon={
            <MaterialIcons name="logout" size={24} color={colors.warning} />
          }
          title={t('signOut')}
          onPress={onSignOutPress}
          color={colors.warning}
        />
      </View>
    </View>
  );
};

export default Account;
