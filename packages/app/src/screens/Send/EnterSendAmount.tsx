import StyledButton from '@/components/StyledButton';
import StyledTextInput from '@/components/StyledTextInput';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { formatUnits, parseUnits } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'EnterSendAmount'>;

const EnterSendAmount = ({ navigation, route }: Props) => {
  const [amount, setAmount] = useState<null | number>(null);
  const { data: balance } = trpc.getBalance.useQuery();
  const { t } = useTranslation("EnterSendAmount");

  const recipientUserOrAddress = route.params.recipientUserOrAddress;

  const onNextClick = useCallback(async () => {
    navigation.navigate('ConfirmSend', {
      recipientUserOrAddress,
      amount,
    });
  }, [amount, recipientUserOrAddress]);

  const parsedAmount = amount ? parseUnits(amount.toString(), 6) : null;

  const canGoNext = balance && parsedAmount && parsedAmount <= balance;

  const recipient =
    typeof recipientUserOrAddress === 'string'
      ? shortenAddress(recipientUserOrAddress)
      : recipientUserOrAddress.name;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        marginTop: 40,
      }}
    >
      <StyledTextInput
        autoFocus
        containerStyle={{
          marginVertical: 20,
        }}
        placeholder="Amount"
        value={amount !== null ? amount.toString() : ''}
        onChangeText={_amount => {
          if (_amount === '') {
            setAmount(null);
          } else {
            setAmount(Number(_amount));
          }
        }}
        keyboardType="numeric"
        postfix="USDC"
      ></StyledTextInput>
      {balance && parsedAmount > balance ? (
        <Text
          style={{
            color: theme.waning,
            marginBottom: 10,
          }}
        >
          {t('insufficientBalance')}
        </Text>
      ) : null}
      <Text
        style={{
          color: theme.text,
          opacity: 0.6,
        }}
      >
        {t('availableBalance', {
          amount: balance ? formatUnits(balance, 6) : '',
        })}
      </Text>
      <Text
        style={{
          color: theme.text,
          fontSize: 14,
          marginTop: 8,
          opacity: 0.6,
        }}
      >
        {t('sendToUser', { name: recipient })}
      </Text>
      <StyledButton
        style={{
          marginTop: 24,
        }}
        title={t('next', { ns: 'common' })}
        onPress={onNextClick}
        disabled={!canGoNext}
      ></StyledButton>
    </View>
  );
};

export default EnterSendAmount;
