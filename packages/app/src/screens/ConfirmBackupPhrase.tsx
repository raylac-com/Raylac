import useMnemonic from '@/hooks/useMnemonic';
import { theme } from '@/lib/theme';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import * as bip39 from 'bip39';
import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import Toast from 'react-native-toast-message';
import { setBackupVerificationStatus } from '@/lib/key';
import MnemonicWord from '@/components/MnemonicWord';

const generateRandomNumbers = ({
  max,
  count,
}: {
  max: number;
  count: number;
}) => {
  const randomNumbers = [];

  while (randomNumbers.length < count) {
    const randomNumber = Math.floor(Math.random() * (max + 1)); // Generates a number between 0 and max
    if (!randomNumbers.includes(randomNumber)) {
      randomNumbers.push(randomNumber);
    }
  }

  return randomNumbers;
};

const shuffleArray = (array: any[]) => {
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

const ConfirmBackupPhrase = () => {
  const mnemonic = useMnemonic();
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [hideIndices, _setHideIndices] = useState<number[]>(
    generateRandomNumbers({
      max: 11,
      count: 3,
    }).sort((a, b) => a - b)
  );

  const [choices, _setChoices] = useState([]);

  const navigation = useTypedNavigation();

  useEffect(() => {
    if (mnemonic) {
      _setChoices(
        shuffleArray([
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
      if (userInputs.length === 3) {
        // Check the mnemonic
        const mnemonicWords = mnemonic.split(' ');
        const filledMnemonic = mnemonicWords.map((word, index) => {
          const hideIndex = hideIndices.indexOf(index);
          // eslint-disable-next-line security/detect-object-injection
          return hideIndex !== -1 ? userInputs[hideIndex] : word;
        });

        const mnemonicValid = bip39.validateMnemonic(filledMnemonic.join(' '));

        if (mnemonicValid) {
          Toast.show({
            type: 'success',
            text1: 'Backup phrase confirmed',
            visibilityTime: 1500,
          });

          await setBackupVerificationStatus('complete');

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
  }, [userInputs]);

  return (
    <View
      style={{
        padding: 16,
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
                bgColor={hide ? theme.primary : theme.text}
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
          color: theme.text,
          textAlign: 'center',
          fontSize: 16,
        }}
      >
        Choose 3 words from the list below that complete the phrase
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
                  bgColor={disabled ? theme.gray : theme.text}
                ></MnemonicWord>
              </Pressable>
            );
          }}
          style={{
            marginBottom: 16,
          }}
          numColumns={3}
        ></FlatList>
        <StyledButton
          variant="underline"
          title="Clear"
          onPress={() => {
            setUserInputs([]);
          }}
        ></StyledButton>
      </View>
    </View>
  );
};

export default ConfirmBackupPhrase;
