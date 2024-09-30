import StyledButton from '@/components/StyledButton';
import { getMnemonic } from '@/lib/key';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { copyToClipboard } from '@/lib/utils';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import useSignedInUser from '@/hooks/useSignedInUser';

const BackupAccount = () => {
  const { t } = useTranslation('BackupAccount');
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  const { data: signedInUser } = useSignedInUser();
  const onRevealPress = useCallback(async () => {
    if (!signedInUser) {
      throw new Error('User not signed in');
    }

    setMnemonic(await getMnemonic(signedInUser.id));
  }, [setMnemonic, signedInUser]);

  const onHidePress = useCallback(() => {
    setMnemonic(null);
  }, [setMnemonic]);

  const onCopyPress = useCallback(() => {
    copyToClipboard(mnemonic);

    Toast.show({
      type: 'success',
      text1: 'Copied backup phrase',
      position: 'bottom',
    });
  }, [mnemonic]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: 24,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: 24,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 8,
            width: '62%',
          }}
        >
          <AntDesign name="warning" size={24} color="orange" />
          <Text
            style={{
              color: theme.text,
              fontWeight: 'bold',
            }}
          >
            {t('backupWarning1')}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 8,
            width: '62%',
          }}
        >
          <AntDesign name="eye" size={24} color="lightblue" />
          <Text
            style={{
              color: theme.text,
              fontWeight: 'bold',
            }}
          >
            {t('backupWarning2')}
          </Text>
        </View>
      </View>
      {mnemonic ? (
        <Pressable
          style={{
            width: '100%',
            alignItems: 'center',
            flexDirection: 'column',
            rowGap: 6,
          }}
          onPress={onCopyPress}
        >
          <Text
            style={{
              borderColor: theme.text,
              borderWidth: 1,
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderRadius: 8,
              color: theme.text,
              width: '80%',
              marginTop: 24,
              fontSize: 18,
            }}
          >
            {mnemonic}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: 8,
              marginTop: 12,
            }}
          >
            <Feather name="copy" size={18} color={theme.text} />
            <Text
              style={{
                color: theme.text,
              }}
            >
              {t('copyBackupPhrase')}
            </Text>
          </View>
        </Pressable>
      ) : null}
      {mnemonic ? (
        <StyledButton
          title={t('hideBackupPhrase')}
          onPress={onHidePress}
          style={{
            marginTop: 36,
          }}
        ></StyledButton>
      ) : (
        <StyledButton
          title={t('revealBackupPhrase')}
          onPress={onRevealPress}
          style={{
            marginTop: 36,
          }}
        ></StyledButton>
      )}
    </View>
  );
};

export default BackupAccount;