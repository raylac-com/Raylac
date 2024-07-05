import { View } from 'react-native';
import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import useGetNewDepositAccount from '@/hooks/useGetNewDepositAccount';
import { useCallback, useState } from 'react';
import useTypedNavigation from '@/hooks/useTypedNavigation';

const EnterDepositAmount = () => {
  const navigation = useTypedNavigation();

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
          marginTop: 20,
        }}
        keyboardType="numeric"
        postfix="USDC"
      ></StyledTextInput>
      <StyledButton
        title="Next"
        onPress={onNextClick}
        isLoading={isGettingDepositAccount}
      ></StyledButton>
    </View>
  );
};

export default EnterDepositAmount;
