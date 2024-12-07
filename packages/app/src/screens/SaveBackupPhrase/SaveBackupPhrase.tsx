import MnemonicWord from '@/components/MnemonicWord/MnemonicWord';
import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { getMnemonicAndPrivKey } from '@/lib/key';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import spacing from '@/lib/styles/spacing';
import { copyToClipboard } from '@/lib/utils';
import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

const SaveBackupPhrase = () => {
  const navigation = useTypedNavigation();

  const [mnemonic, setMnemonic] = useState<string | null>(null);

  const onRevealPress = useCallback(async () => {
    const result = await getMnemonicAndPrivKey();
    if (result) {
      setMnemonic(result.mnemonic);
    } else {
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
        padding: 16,
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
              title={'Hide backup phrase'}
              onPress={onHidePress}
            ></StyledButton>
          ) : (
            <StyledButton
              title={'Reveal backup phrase'}
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
          title="I saved my backup phrase"
          onPress={() => {
            navigation.navigate('ConfirmBackupPhrase');
          }}
        ></StyledButton>
      </View>
    </View>
  );
};

export default SaveBackupPhrase;
