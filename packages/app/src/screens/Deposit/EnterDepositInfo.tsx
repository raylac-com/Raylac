import { View } from 'react-native';
import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import useGetNewDepositAccount from '@/hooks/useGetNewDepositAccount';
import { useCallback, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DepositStackParamsList } from '@/navigation/types';

type Props = NativeStackScreenProps<DepositStackParamsList, 'EnterDepositInfo'>;

const EnterDepositInfo = ({ navigation }: Props) => {
  const {
    mutateAsync: getNewDepositAccount,
    isPending: isGettingDepositAccount,
  } = useGetNewDepositAccount();
  const [amount, setAmount] = useState<null | number>(null);

  const onNextClick = useCallback(async () => {
    const account = await getNewDepositAccount();

    navigation.navigate('ConfirmDeposit', {
      address: account.address,
      amount,
    });
  }, [amount]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <StyledTextInput
        placeholder="Amount"
        value={amount ? amount.toString() : ''}
        onChangeText={_amount => {
          setAmount(Number(_amount));
        }}
        style={{
          width: 200,
        }}
        keyboardType="numeric"
        postfix='USDC'
      ></StyledTextInput>
      <StyledButton
        title="Next"
        onPress={onNextClick}
        isLoading={isGettingDepositAccount}
      ></StyledButton>
    </View>
  );
};

export default EnterDepositInfo;
