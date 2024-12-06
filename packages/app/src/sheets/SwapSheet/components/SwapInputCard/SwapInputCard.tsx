import { TextInput, View } from 'react-native';
import colors from '@/lib/styles/colors';
import SwapAmountInput from '../SwapAmountInput';
import { formatUnits } from 'viem';
import {
  GetTokenPriceReturnType,
  SupportedTokensReturnType,
} from '@raylac/shared';
import StyledText from '@/components/StyledText/StyledText';
import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';

const SwapInputCard = ({
  token,
  setToken,
  amount,
  balance,
  setAmount,
}: {
  token: SupportedTokensReturnType[number] | null;
  setToken: (value: SupportedTokensReturnType[number] | null) => void;
  amount: string;
  setAmount: (value: string) => void;
  balance: bigint | null;
}) => {
  const [usdAmountInput, setUsdAmountInput] = useState<string>('');

  const { data: tokenPrices } =
    trpc.getTokenPrice.useQuery<GetTokenPriceReturnType>({
      tokenAddress: token.addresses[0].address,
      chainId: token.addresses[0].chainId,
    });

  const tokenPrice = tokenPrices?.prices.find(
    price => price.currency === 'usd'
  )?.value;

  useEffect(() => {
    if (tokenPrice !== undefined && amount !== null) {
      const usdAmount = Number(amount) / Number(tokenPrice);

      setUsdAmountInput(usdAmount.toString());
    }
  }, [tokenPrice, amount]);

  const onUsdAmountChange = (value: string) => {
    setUsdAmountInput(value);

    if (value === '') {
      setAmount('');
      return;
    }

    if (tokenPrice !== undefined && value !== '') {
      const tokenAmount = Number(value) / Number(tokenPrice);

      setAmount(tokenAmount.toString());
    }
  };

  const tokenBalanceFormatted = balance
    ? formatUnits(balance, token.decimals)
    : '';

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
      <SwapAmountInput
        selectedToken={token}
        setSelectedToken={setToken}
        amount={amount}
        setAmount={setAmount}
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
          <View
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
          >
            <StyledText
              style={{ color: colors.subbedText, fontWeight: 'bold' }}
            >
              {tokenBalanceFormatted} {token.symbol}
            </StyledText>
            <StyledText
              style={{
                color: colors.subbedText,
                fontWeight: 'bold',
              }}
            >{`MAX`}</StyledText>
          </View>
        </View>
      )}
    </View>
  );
};

export default SwapInputCard;
