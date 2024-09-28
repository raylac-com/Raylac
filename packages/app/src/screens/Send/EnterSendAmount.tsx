import StyledButton from '@/components/StyledButton';
import { theme } from '@/lib/theme';
import { shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, TextInput, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { Hex, parseUnits } from 'viem';
import { trpc } from '@/lib/trpc';
import { formatAmount, getChainsForMode } from '@raylac/shared';
import FastAvatar from '@/components/FastAvatar';
import { publicKeyToAddress } from 'viem/accounts';
import useSignedInUser from '@/hooks/useSignedInUser';

type Props = NativeStackScreenProps<RootStackParamsList, 'EnterSendAmount'>;

const containsNonNumberChars = (str: string): boolean => {
  return !/^(-?)([0-9]*)\.?([0-9]*)$/.test(str);
};

const EnterSendAmount = ({ navigation, route }: Props) => {
  const { data: signedInUser } = useSignedInUser();

  const chains = getChainsForMode(signedInUser?.devModeEnabled || false);

  const [outputChain, setOutputChain] = useState(chains[0].id);
  const [amount, setAmount] = useState<string>('');

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery();

  const [tokenId, setTokenId] = useState('eth');

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

  const canGoNext = isBalanceSufficient && parsedInputAmount > BigInt(0);

  const recipientDisplayName =
    typeof recipientUserOrAddress === 'string'
      ? shortenAddress(recipientUserOrAddress)
      : recipientUserOrAddress.name;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'flex-start',
          columnGap: 8,
          zIndex: 3000,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            backgroundColor: theme.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.gray,
            height: 52,
          }}
        >
          <TextInput
            autoFocus
            value={amount !== null ? amount.toString() : ''}
            onChangeText={_amount => {
              if (containsNonNumberChars(_amount)) {
                return;
              }

              if (_amount === '') {
                setAmount(null);
              } else {
                setAmount(_amount);
              }
            }}
            style={{
              fontSize: 28,
              textAlign: 'right',
              color: theme.text,
            }}
            keyboardType="numeric"
          ></TextInput>
        </View>
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
          justifyContent: 'flex-end',
          paddingHorizontal: 16,
          zIndex: 1000,
          marginTop: 24,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            columnGap: 8,
            marginRight: 12,
          }}
        >
          <FastAvatar
            imageUrl={
              typeof recipientUserOrAddress === 'string'
                ? null
                : recipientUserOrAddress.profileImage
            }
            address={
              typeof recipientUserOrAddress === 'string'
                ? recipientUserOrAddress
                : publicKeyToAddress(
                    recipientUserOrAddress.spendingPubKey as Hex
                  )
            }
            size={24}
          ></FastAvatar>
          <Text
            style={{
              color: theme.text,
            }}
          >
            {recipientDisplayName} receives on
          </Text>
        </View>
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
          items={chains.map(chain => ({
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
      <View
        style={{
          width: '100%',
          paddingHorizontal: 16,
          marginTop: 32,
        }}
      >
        <StyledButton
          style={{
            width: '100%',
          }}
          title={t('next', { ns: 'common' })}
          onPress={onNextClick}
          disabled={!canGoNext}
        ></StyledButton>
      </View>
    </View>
  );
};

export default EnterSendAmount;
