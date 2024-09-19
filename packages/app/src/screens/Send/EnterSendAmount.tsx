import StyledButton from '@/components/StyledButton';
import StyledNumberInput from '@/components/StyledNumberInput';
import { theme } from '@/lib/theme';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import * as chains from 'viem/chains';
import supportedChains from '@raylac/shared/out/supportedChains';
import { parseUnits } from 'viem';
import { trpc } from '@/lib/trpc';
import { formatAmount } from '@raylac/shared';

type Props = NativeStackScreenProps<RootStackParamsList, 'EnterSendAmount'>;

const containsNonNumberChars = (str: string): boolean => {
  return /[^\d.-]/.test(str);
};

const EnterSendAmount = ({ navigation, route }: Props) => {
  const [outputChain, setOutputChain] = useState(chains.base.id);
  const [amount, setAmount] = useState<string>('');

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery();

  const [tokenId, setTokenId] = useState('usdc');

  useEffect(() => {
    if (tokenBalances) {
      const firstTokenWithBalance =
        tokenBalances.length > 0 ? tokenBalances[0] : null;

      if (firstTokenWithBalance) {
        setTokenId(firstTokenWithBalance.tokenId);
      }
    }
  }, [tokenBalances]);

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

  const [inputTokenPickerOpen, setInputTokenPickerOpen] = useState(false);
  const [outputChainPickerOpen, setOutputChainPickerOpen] = useState(false);

  const recipientUserOrAddress = route.params.recipientUserOrAddress;

  const inputTokenData = supportedTokens.find(
    token => token.tokenId === tokenId
  );

  const parsedInputAmount = amount
    ? parseUnits(amount, inputTokenData.decimals)
    : BigInt(0);

  const onNextClick = useCallback(async () => {
    console.log({ outputChain });
    navigation.navigate('ConfirmSend', {
      recipientUserOrAddress,
      amount: parsedInputAmount.toString(),
      tokenId,
      outputChainId: outputChain,
    });
  }, [parsedInputAmount, recipientUserOrAddress, tokenId, outputChain]);

  const inputTokenBalance = BigInt(
    tokenBalances?.find(token => token.tokenId === tokenId)?.balance || '0'
  );

  const isBalanceSufficient =
    inputTokenBalance !== null && amount !== null
      ? parseUnits(amount, inputTokenData.decimals) <= inputTokenBalance
      : null;

  const canGoNext = isBalanceSufficient;

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
          alignItems: 'flex-start',
          columnGap: 8,
          zIndex: 3000,
        }}
      >
        <StyledNumberInput
          autoFocus
          value={amount !== null ? amount.toString() : ''}
          onChangeText={_amount => {
            if (containsNonNumberChars(_amount)) {
              return;
            }

            // Regex to match floating-point numbers (allowing one decimal point)
//            if (/^\d*\.?\d*$/.test(_amount)) {
//              setAmount(_amount);
//            }

            if (_amount === '') {
              setAmount(null);
            } else {
              setAmount(_amount);
            }
          }}
          containerStyle={{
            height: 52,
          }}
          inputStyle={{
            width: 180,
            textAlign: 'right',
          }}
          keyboardType="numeric"
        ></StyledNumberInput>
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DropDownPicker
            open={inputTokenPickerOpen}
            value={tokenId}
            style={{
              width: 120,
              height: 52,
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
              setInputTokenPickerOpen(_open);
            }}
            setValue={setTokenId}
            setItems={setCurrencies}
          />
          <Text
            style={{
              color: theme.text,
              marginTop: 4,
              textAlign: 'center',
              opacity: 0.8,
            }}
          >
            {formatAmount(
              inputTokenBalance.toString(),
              inputTokenData.decimals
            )}{' '}
            {inputTokenData.symbol}
          </Text>
        </View>
      </View>

      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '82%',
          zIndex: 1000,
          marginTop: 24,
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
            if (inputTokenPickerOpen) {
              setInputTokenPickerOpen(false);
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
