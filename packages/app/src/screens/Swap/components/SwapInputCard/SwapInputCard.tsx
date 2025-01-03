import { Pressable, TextInput, View } from 'react-native';
import colors from '@/lib/styles/colors';
import SwapAmountInput from '../SwapAmountInput';
import { formatUnits } from 'viem';
import { formatAmount, SupportedTokensReturnType } from '@raylac/shared';
import StyledText from '@/components/StyledText/StyledText';
import { useEffect, useState } from 'react';
import Skeleton from '@/components/Skeleton/Skeleton';
import useTokenPriceUsd from '@/hooks/useTokenPriceUsd';
import { useSearchInputTokenSheet } from '@/contexts/SearchInputTokenSheetContext';
import ChainSelector from '../ChainSelector/ChainSelector';

const SwapInputCard = ({
  token,
  setToken,
  amount,
  balance,
  isLoadingBalance,
  setAmount,
  chainId,
  setChainId,
}: {
  token: SupportedTokensReturnType[number] | null;
  setToken: (value: SupportedTokensReturnType[number] | null) => void;
  amount: string;
  setAmount: (value: string) => void;
  balance: bigint | undefined;
  isLoadingBalance: boolean;
  chainId: number | null;
  setChainId: (value: number | null) => void;
}) => {
  const { setIsOpen, selectedToken } = useSearchInputTokenSheet();

  const [userInputMode, setUserInputMode] = useState<'USD' | 'TOKEN'>('TOKEN');
  const [usdAmountInput, setUsdAmountInput] = useState<string>('');

  const { data: tokenPriceUsd } = useTokenPriceUsd(token);

  useEffect(() => {
    if (selectedToken) {
      setToken(selectedToken);
    }
  }, [selectedToken]);

  useEffect(() => {
    if (userInputMode === 'TOKEN' && tokenPriceUsd !== undefined) {
      const usdAmount = Number(amount) * Number(tokenPriceUsd);

      if (usdAmountInput === '' && usdAmount === 0) {
        return;
      }

      setUsdAmountInput(usdAmount.toFixed(2));
    }
  }, [tokenPriceUsd, amount, userInputMode]);

  const onUsdAmountChange = (usdAmountText: string) => {
    setUserInputMode('USD');
    setUsdAmountInput(usdAmountText);

    if (usdAmountText === '') {
      setAmount('');
      return;
    }

    if (tokenPriceUsd !== undefined && usdAmountText !== '') {
      const tokenAmount = Number(usdAmountText) / Number(tokenPriceUsd);

      setAmount(tokenAmount.toString());
    }
  };

  const tokenBalanceFormatted =
    balance !== undefined && token
      ? formatAmount(balance.toString(), token.decimals)
      : undefined;

  const showChainSelector = token && token.addresses.length > 1;

  return (
    <View
      style={{
        flexDirection: 'column',
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 30,
        paddingHorizontal: 22,
        paddingVertical: 20,
        rowGap: 14,
      }}
    >
      {showChainSelector && chainId !== null && (
        <ChainSelector chainId={chainId} setChainId={setChainId} />
      )}
      <SwapAmountInput
        selectedToken={token}
        onSelectTokenPress={() => {
          setIsOpen(true);
        }}
        isLoadingAmount={false}
        amount={amount}
        setAmount={value => {
          setUserInputMode('TOKEN');
          setAmount(value);
        }}
      />
      {token && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
          >
            <TextInput
              style={{
                color: colors.subbedText,
                fontWeight: 'bold',
              }}
              value={usdAmountInput}
              keyboardType="numeric"
              onChangeText={onUsdAmountChange}
              placeholder="0.00"
            />
            <StyledText
              style={{ color: colors.subbedText, fontWeight: 'bold' }}
            >
              {`USD`}
            </StyledText>
          </View>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
            onPress={() => {
              if (balance !== undefined && token) {
                const parsedBalance = formatUnits(balance, token.decimals);
                setAmount(parsedBalance);
              }
            }}
          >
            {isLoadingBalance ? (
              <Skeleton style={{ width: 53, height: 18 }} />
            ) : (
              <StyledText
                style={{ color: colors.subbedText, fontWeight: 'bold' }}
              >
                {tokenBalanceFormatted} {token.symbol}
              </StyledText>
            )}
            <StyledText
              style={{
                color: colors.subbedText,
                fontWeight: 'bold',
              }}
            >{`MAX`}</StyledText>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default SwapInputCard;
