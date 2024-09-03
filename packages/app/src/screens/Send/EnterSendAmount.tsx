import StyledButton from '@/components/StyledButton';
import StyledNumberInput from '@/components/StyledNumberInput';
import { theme } from '@/lib/theme';
import { trpc } from '@/lib/trpc';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { formatUnits, parseUnits } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'EnterSendAmount'>;

const EnterSendAmount = ({ navigation, route }: Props) => {
  const [inputCurrency, setInputCurrency] = useState<'jpy' | 'usd'>('usd');
  const [inputAmount, setInputAmount] = useState<null | number>(null);
  const { data: balance } = trpc.getBalance.useQuery();
  const { t } = useTranslation('EnterSendAmount');
  const { data: jpyToUsd } = trpc.getUsdToJpy.useQuery();

  const recipientUserOrAddress = route.params.recipientUserOrAddress;

  const usdAmount =
    inputAmount !== null && jpyToUsd !== null
      ? inputCurrency === 'usd'
        ? inputAmount
        : Math.round((inputAmount / jpyToUsd) * 100) / 100
      : null;

  const onNextClick = useCallback(async () => {
    navigation.navigate('ConfirmSend', {
      recipientUserOrAddress,
      amount: usdAmount,
    });
  }, [inputAmount, recipientUserOrAddress, usdAmount]);

  const parsedUsdAmount = usdAmount
    ? parseUnits(usdAmount.toString(), 6)
    : null;

  const canGoNext = balance && parsedUsdAmount && parsedUsdAmount <= balance;

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <StyledNumberInput
          autoFocus
          containerStyle={{
            borderBottomColor: theme.gray,
            borderBottomWidth: 1,
          }}
          value={inputAmount !== null ? inputAmount.toLocaleString() : ''}
          onChangeText={_amount => {
            console.log(_amount);
            if (_amount === '') {
              setInputAmount(null);
            } else {
              setInputAmount(Number(_amount.replaceAll(',', '')));
            }
          }}
          inputStyle={{
            width: 180,
            textAlign: 'right',
          }}
          keyboardType="numeric"
        ></StyledNumberInput>
        <Picker
          selectedValue={inputCurrency}
          onValueChange={itemValue => {
            setInputCurrency(itemValue);
          }}
          style={{
            width: 100,
            marginRight: -48,
          }}
          itemStyle={{
            fontSize: 16,
            color: theme.text,
            fontWeight: 'bold',
          }}
        >
          <Picker.Item label="USD" value="usd" />
          <Picker.Item label="円" value="jpy" />
        </Picker>
      </View>
      <View
        style={{
          height: 20,
          marginTop: -32,
          opacity: 0.6,
          marginBottom: 12,
        }}
      >
        {inputCurrency === 'jpy' && usdAmount && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FontAwesome name="exchange" size={12} color={theme.secondary} />
            <Text
              style={{
                color: theme.secondary,
                fontSize: 14,
                marginLeft: 4,
              }}
            >
              {usdAmount} USD
            </Text>
          </View>
        )}
      </View>
      {balance && parsedUsdAmount > balance ? (
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
