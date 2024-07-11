import { View } from 'react-native';
import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import useGetNewDepositAccount from '@/hooks/useGetNewDepositAccount';
import { useCallback, useState } from 'react';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import { useTranslation } from 'react-i18next';

const EnterDepositAmount = () => {
  const navigation = useTypedNavigation();
  const { t } = useTranslation();
  const [isGettingDepositAccount, setIsGettingDepositAccount] = useState(false);

  const { mutateAsync: getNewDepositAccount } = useGetNewDepositAccount();
  const [amount, setAmount] = useState<null | number>(null);

  const onNextClick = useCallback(async () => {
    setIsGettingDepositAccount(true);
    const account = await getNewDepositAccount();
    setIsGettingDepositAccount(false);

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
        marginTop: 40,
      }}
    >
      <StyledTextInput
        autoFocus
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
        title={t('next', { ns: 'common' })}
        onPress={onNextClick}
        isLoading={isGettingDepositAccount}
        style={{
          marginTop: 24,
        }}
      ></StyledButton>
    </View>
  );
};

export default EnterDepositAmount;
