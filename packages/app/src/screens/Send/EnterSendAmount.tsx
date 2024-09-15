import StyledButton from '@/components/StyledButton';
import StyledNumberInput from '@/components/StyledNumberInput';
import { theme } from '@/lib/theme';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import useAggregatedTokenBalances from '@/hooks/useAggregatedTokenBalances';
import * as chains from 'viem/chains';
import supportedChains from '@raylac/shared/out/supportedChains';
import { parseUnits } from 'viem';

type Props = NativeStackScreenProps<RootStackParamsList, 'EnterSendAmount'>;

const EnterSendAmount = ({ navigation, route }: Props) => {
  const [inputTokenId, setInputTokenId] = useState('usdc');
  const [outputTokenId, setOutputTokenId] = useState('usdc');
  const [outputChain, setOutputChain] = useState(chains.base.id);

  const [inputAmount, setInputAmount] = useState<string>('');
  const [outputAmount, setOutputAmount] = useState<string>('');

  const { aggregatedTokenBalances } = useAggregatedTokenBalances();

  const [currencies, setCurrencies] = useState(
    supportedTokens.map(token => ({
      label: token.symbol,
      value: token.tokenId,
      icon: () => {
        return (
          <Image
            style={{
              width: 18,
              height: 18,
            }}
            source={{ uri: token.logoURI }}
          ></Image>
        );
      },
    }))
  );

  const { t } = useTranslation('EnterSendAmount');

  const [inputPickerOpen, setInputPickerOpen] = useState(false);
  const [outputPickerOpen, setOutputPickerOpen] = useState(false);
  const [outputChainPickerOpen, setOutputChainPickerOpen] = useState(false);

  const recipientUserOrAddress = route.params.recipientUserOrAddress;

  const inputTokenData = supportedTokens.find(
    token => token.tokenId === inputTokenId
  );

  const parsedInputAmount = inputAmount
    ? parseUnits(inputAmount, inputTokenData.decimals)
    : BigInt(0);

  const onNextClick = useCallback(async () => {
    console.log({ outputChain });
    navigation.navigate('ConfirmSend', {
      recipientUserOrAddress,
      amount: parsedInputAmount.toString(),
      inputTokenId,
      outputTokenId,
      outputChainId: outputChain,
    });
  }, [
    parsedInputAmount,
    recipientUserOrAddress,
    inputTokenId,
    outputTokenId,
    outputChain,
  ]);

  const inputTokenBalance = aggregatedTokenBalances
    ? aggregatedTokenBalances[inputTokenId] || BigInt(0)
    : null;

  const isBalanceSufficient =
    inputTokenBalance !== null && inputAmount !== null
      ? parseUnits(inputAmount, inputTokenData.decimals) <= inputTokenBalance
      : null;

  console.log(isBalanceSufficient, inputTokenBalance);

  const canGoNext = isBalanceSufficient;

  const recipient =
    typeof recipientUserOrAddress === 'string'
      ? shortenAddress(recipientUserOrAddress)
      : recipientUserOrAddress.name;

  console.log('input string', inputAmount?.toString());

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
          columnGap: 8,
          zIndex: 3000,
        }}
      >
        <StyledNumberInput
          autoFocus
          value={inputAmount !== null ? inputAmount.toString() : ''}
          onChangeText={_amount => {
            // Regex to match floating-point numbers (allowing one decimal point)
            if (/^\d*\.?\d*$/.test(_amount)) {
              setInputAmount(_amount);
            }

            console.log(_amount);
            if (_amount === '') {
              setInputAmount(null);
            } else {
              console.log('repalce all', _amount.replaceAll(',', ''));
              setInputAmount(_amount);
            }
          }}
          inputStyle={{
            width: 180,
            height: 32,
            textAlign: 'right',
          }}
          keyboardType="numeric"
        ></StyledNumberInput>
        <DropDownPicker
          open={inputPickerOpen}
          value={inputTokenId}
          style={{
            width: 120,
          }}
          containerStyle={{
            width: 120,
          }}
          arrowIconStyle={{
            width: 12,
            height: 12,
          }}
          items={currencies}
          setOpen={_open => {
            if (outputPickerOpen) {
              setOutputPickerOpen(false);
            }
            setInputPickerOpen(_open);
          }}
          setValue={setInputTokenId}
          setItems={setCurrencies}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 2000,
        }}
      >
        <StyledNumberInput
          value={outputAmount !== null ? outputAmount.toLocaleString() : ''}
          onChangeText={_amount => {
            if (_amount === '') {
              setOutputAmount(null);
            } else {
              setOutputAmount(_amount.replaceAll(',', ''));
            }
          }}
          inputStyle={{
            width: 180,
            textAlign: 'right',
          }}
          keyboardType="numeric"
        ></StyledNumberInput>
        <DropDownPicker
          open={outputPickerOpen}
          value={outputTokenId}
          style={{
            width: 120,
          }}
          containerStyle={{
            width: 120,
          }}
          dropDownContainerStyle={{
            backgroundColor: theme.background,
          }}
          items={currencies}
          setOpen={_open => {
            if (inputPickerOpen) {
              setInputPickerOpen(false);
            }
            setOutputPickerOpen(_open);
          }}
          setValue={setOutputTokenId}
          setItems={setCurrencies}
        />
      </View>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '82%',
          zIndex: 1000,
        }}
      >
        <Text
          style={{
            color: theme.text,
          }}
        >
          Recipient receives on
        </Text>
        <DropDownPicker
          open={outputChainPickerOpen}
          value={outputChain}
          style={{
            width: 120,
            borderWidth: 0,
          }}
          textStyle={{
            color: theme.text,
          }}
          theme="DARK"
          containerStyle={{
            width: 120,
          }}
          items={supportedChains.map(chain => ({
            label: chain.name,
            value: chain.id,
          }))}
          setOpen={_open => {
            if (inputPickerOpen) {
              setInputPickerOpen(false);
            }
            if (outputPickerOpen) {
              setOutputPickerOpen(false);
            }

            setOutputChainPickerOpen(_open);
          }}
          setValue={setOutputChain}
        />
      </View>
      {isBalanceSufficient === false ? (
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
