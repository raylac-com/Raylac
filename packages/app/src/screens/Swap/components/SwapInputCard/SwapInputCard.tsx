import { Text, View } from 'react-native';
import colors from '@/lib/styles/colors';
import SwapAmountInput from '../SwapAmountInput';
import { formatUnits } from 'viem';
import { SupportedTokensReturnType } from '@raylac/shared';

const SwapInputCard = ({
  token,
  setToken: _setToken,
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
        amount={amount}
        setAmount={setAmount}
      />
      {token && (
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ color: colors.subbedText, fontWeight: 'bold' }}>
            {tokenBalanceFormatted} {token.symbol}
          </Text>
          <Text style={{ color: colors.subbedText, fontWeight: 'bold' }}>
            {`  MAX`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default SwapInputCard;
