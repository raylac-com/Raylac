import MnemonicWord from '@/components/MnemonicWord';
import StyledButton from '@/components/StyledButton';
import useSignedInUser from '@/hooks/useSignedInUser';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { getMnemonic } from '@/lib/key';
import { theme } from '@/lib/theme';
import { copyToClipboard } from '@/lib/utils';
import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

const SaveBackupPhrase = () => {
  const navigation = useTypedNavigation();

  const [mnemonic, setMnemonic] = useState<string | null>(null);

  const { data: signedInUser } = useSignedInUser();
  const onRevealPress = useCallback(async () => {
    if (!signedInUser) {
      throw new Error('User not signed in');
    }

    setMnemonic(await getMnemonic());
  }, [setMnemonic, signedInUser]);

  const onHidePress = useCallback(() => {
    setMnemonic(null);
  }, [setMnemonic]);

  const onCopyPress = useCallback(() => {
    copyToClipboard(mnemonic);

    Toast.show({
      type: 'success',
      text1: 'Copied backup phrase',
      position: 'top',
    });
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
            color: theme.text,
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Save your backup phrase
        </Text>
        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            color: theme.gray,
          }}
        >
          Write down your backup phrase, or save it in a secure place.
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
              borderColor: theme.gray,
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
            <Feather name="copy" size={18} color={theme.text} />
            <Text
              style={{
                color: theme.text,
              }}
            >
              Copy
            </Text>
          </Pressable>
        )}
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
