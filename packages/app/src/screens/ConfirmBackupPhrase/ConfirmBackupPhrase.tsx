import colors from '@/lib/styles/colors';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import * as bip39 from 'bip39';
import { useTranslation } from 'react-i18next';
import StyledButton from '@/components/StyledButton/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import Toast from 'react-native-toast-message';
import MnemonicWord from '@/components/MnemonicWord/MnemonicWord';
import fontSizes from '@/lib/styles/fontSizes';
import useMnemonic from '@/hooks/useMnemonic';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamsList } from '@/navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setBackupVerified } from '@/lib/key';

const generateRandomNumbers = ({
  max,
  count,
}: {
  max: number;
  count: number;
}) => {
  const randomNumbers: number[] = [];

  while (randomNumbers.length < count) {
    const randomNumber = Math.floor(Math.random() * (max + 1)); // Generates a number between 0 and max
    if (!randomNumbers.includes(randomNumber)) {
      randomNumbers.push(randomNumber);
    }
  }

  return randomNumbers;
};

const generateRandomConsecutiveNumbers = ({
  max,
  count,
}: {
  max: number;
  count: number;
}) => {
  const start = Math.floor(Math.random() * (max - count));
  return Array.from({ length: count }, (_, index) => start + index);
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line security/detect-object-injection
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
};

const pickRandom = ({ array, count }: { array: any[]; count: number }) => {
  const indices = generateRandomNumbers({ max: array.length - 1, count });
  // eslint-disable-next-line security/detect-object-injection
  return indices.map(index => array[index]);
};

type Props = NativeStackScreenProps<RootStackParamsList, 'ConfirmBackupPhrase'>;

const ConfirmBackupPhrase = ({ route }: Props) => {
  const { t } = useTranslation('ConfirmBackupPhrase');
  const { genesisAddress } = route.params;
  const insets = useSafeAreaInsets();
  const { mnemonic } = useMnemonic(genesisAddress);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [hideIndices, _setHideIndices] = useState<number[]>(
    generateRandomConsecutiveNumbers({ max: 11, count: 3 })
  );

  const [choices, _setChoices] = useState<string[]>([]);

  const navigation = useTypedNavigation();

  useEffect(() => {
    if (mnemonic) {
      _setChoices(
        shuffleArray<string>([
          ...pickRandom({ array: bip39.wordlists.english, count: 6 }),
          ...mnemonic
            .split(' ')
            .filter((_, index) => hideIndices.includes(index)),
        ])
      );
    }
  }, [mnemonic]);

  const onChoicePress = useCallback(
    (word: string) => {
      if (userInputs.includes(word)) {
        // Remove the word from the user inputs
        setUserInputs(userInputs.filter(w => w !== word));
      } else if (userInputs.length < 3) {
        setUserInputs([...userInputs, word]);
      }
    },
    [userInputs, setUserInputs]
  );

  useEffect(() => {
    (async () => {
      if (userInputs.length === 3 && mnemonic) {
        // Check the mnemonic
        const mnemonicWords = mnemonic.split(' ');

        // Fill in the mnemonic with the user inputs
        const filledMnemonic = mnemonicWords.map((word, index) => {
          const hideIndex = hideIndices.indexOf(index);
          // eslint-disable-next-line security/detect-object-injection
          return hideIndex !== -1 ? userInputs[hideIndex] : word;
        });

        const mnemonicValid = mnemonic === filledMnemonic.join(' ');

        if (mnemonicValid) {
          await setBackupVerified(genesisAddress);

          Toast.show({
            type: 'success',
            text1: 'Backup phrase confirmed',
            visibilityTime: 1500,
          });

          navigation.navigate('Tabs', {
            screen: 'Home',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Invalid mnemonic',
            text2: 'Please try again',
            visibilityTime: 2000,
          });
          setUserInputs([]);
        }
      }
    })();
  }, [userInputs, mnemonic]);

  return (
    <View
      style={{
        rowGap: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        paddingBottom: insets.bottom + 16,
        paddingTop: 16,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          rowGap: 16,
        }}
      >
        <FlatList
          data={mnemonic?.split(' ')}
          contentContainerStyle={{
            justifyContent: 'space-between',
            alignContent: 'center',
          }}
          renderItem={({ item, index }) => {
            const hide = hideIndices.includes(index);

            const hideIndex = hideIndices.indexOf(index);
            // eslint-disable-next-line security/detect-object-injection
            const fillWord = hideIndex !== -1 ? userInputs[hideIndex] : '';

            return (
              <View
                key={index}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  flex: 1,
                }}
              >
                <MnemonicWord
                  word={hide ? fillWord : item}
                  index={index + 1}
                  bgColor={hide ? colors.text : colors.border}
                ></MnemonicWord>
              </View>
            );
          }}
          style={{
            marginBottom: 16,
          }}
          numColumns={3}
        ></FlatList>
        <Text
          style={{
            color: colors.text,
            textAlign: 'center',
            fontSize: fontSizes.base,
          }}
        >
          {`Choose 3 words from the list below to complete the phrase`}
        </Text>
        <View style={{}}>
          <FlatList
            data={choices}
            contentContainerStyle={{
              justifyContent: 'space-between',
              alignContent: 'center',
            }}
            renderItem={({ item, index }) => {
              const choiceIndex = userInputs.findIndex(word => item === word);
              const disabled = userInputs.length === 3 || choiceIndex !== -1;

              return (
                <Pressable
                  key={index}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                    flex: 1,
                  }}
                  onPress={() => {
                    onChoicePress(item);
                  }}
                  disabled={disabled}
                >
                  <MnemonicWord
                    word={item}
                    bgColor={disabled ? colors.gray : colors.text}
                  ></MnemonicWord>
                </Pressable>
              );
            }}
            style={{
              marginBottom: 16,
            }}
            numColumns={3}
          ></FlatList>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'space-between',
          rowGap: 16,
        }}
      >
        <StyledButton
          title={t('clear')}
          onPress={() => {
            setUserInputs([]);
          }}
          variant="outline"
        ></StyledButton>
        <StyledButton
          title={t('viewBackupPhrase')}
          onPress={() => {
            navigation.navigate('SaveBackupPhrase', {
              genesisAddress,
            });
          }}
        ></StyledButton>
      </View>
    </View>
  );
};

export default ConfirmBackupPhrase;
