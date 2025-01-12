import MnemonicWord from '@/components/MnemonicWord/MnemonicWord';
import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { getMnemonic } from '@/lib/key';
import { useTranslation } from 'react-i18next';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { copyToClipboard } from '@/lib/utils';
import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamsList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamsList, 'SaveBackupPhrase'>;

const SaveBackupPhrase = ({ route }: Props) => {
  const { t } = useTranslation('SaveBackupPhrase');
  const { genesisAddress } = route.params;
  const insets = useSafeAreaInsets();

  const navigation = useTypedNavigation();

  const [mnemonic, setMnemonic] = useState<string | null>(null);

  const onRevealPress = useCallback(async () => {
    const _mnemonic = await getMnemonic(genesisAddress);
    if (_mnemonic) {
      setMnemonic(_mnemonic);
    } else {
      // TODO: Is this safe?
      throw new Error('Failed to get mnemonic');
    }
  }, [setMnemonic]);

  const onHidePress = useCallback(() => {
    setMnemonic(null);
  }, [setMnemonic]);

  const onCopyPress = useCallback(() => {
    if (mnemonic) {
      copyToClipboard(mnemonic);

      Toast.show({
        type: 'success',
        text1: 'Copied',
        position: 'top',
      });
    }
  }, [mnemonic]);

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
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          rowGap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            color: colors.text,
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          {'Save your backup phrase'}
        </Text>
        <Text
          style={{
            fontSize: fontSizes.base,
            textAlign: 'center',
            color: colors.gray,
          }}
        >
          {'Write down or save your backup phrase'}
        </Text>
      </View>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
          rowGap: 28,
        }}
      >
        {mnemonic && (
          <FlatList
            scrollEnabled={false}
            contentContainerStyle={{
              justifyContent: 'space-between',
              alignContent: 'center',
              borderWidth: 1,
              borderColor: colors.gray,
              borderRadius: 8,
              padding: 8,
            }}
            data={mnemonic.split(' ')}
            renderItem={({ item, index }) => {
              return (
                <View
                  key={index}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <MnemonicWord
                    key={index}
                    word={item}
                    index={index + 1}
                  ></MnemonicWord>
                </View>
              );
            }}
            numColumns={3}
          ></FlatList>
        )}
        {mnemonic && (
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: 8,
            }}
            onPress={onCopyPress}
          >
            <Feather name="copy" size={18} color={colors.text} />
            <Text
              style={{
                color: colors.text,
              }}
            >
              {'Copy backup phrase'}
            </Text>
          </Pressable>
        )}
        <View style={{ width: '62%', marginTop: spacing.default }}>
          {mnemonic ? (
            <StyledButton
              title={t('hideBackupPhrase')}
              onPress={onHidePress}
            ></StyledButton>
          ) : (
            <StyledButton
              title={t('revealBackupPhrase')}
              onPress={onRevealPress}
            ></StyledButton>
          )}
        </View>
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        <StyledButton
          title={t('savedBackupPhrase')}
          onPress={() => {
            navigation.navigate('ConfirmBackupPhrase', {
              genesisAddress,
            });
          }}
        ></StyledButton>
      </View>
    </View>
  );
};

export default SaveBackupPhrase;
