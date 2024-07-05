import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamsList, 'EnterSendAmount'>;

const EnterSendAmount = ({ navigation, route }: Props) => {
  const [amount, setAmount] = useState<null | number>(null);

  const onNextClick = useCallback(async () => {
    console.log('amount', amount);
    navigation.navigate('ConfirmSend', {
      recipientUserOrAddress: route.params.recipientUserOrAddress,
      amount,
    });
  }, [amount]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        rowGap: 8,
      }}
    >
      <StyledTextInput
        placeholder="Amount"
        value={amount ? amount.toString() : ''}
        onChangeText={_amount => {
          setAmount(Number(_amount));
        }}
        style={{
          width: 120,
        }}
        keyboardType="numeric"
        postfix="USDC"
      ></StyledTextInput>
      <StyledButton title="Next" onPress={onNextClick}></StyledButton>
    </View>
  );
};

export default EnterSendAmount;
