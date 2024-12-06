import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import SwapAmountInput from '../SwapAmountInput';
import { SupportedTokensReturnType } from '@raylac/shared';

const SwapOutputCard = ({
  token,
  setToken,
  amount,
  setAmount,
  isLoadingAmount,
}: {
  token: SupportedTokensReturnType[number] | null;
  setToken: (value: SupportedTokensReturnType[number] | null) => void;
  amount: string;
  setAmount: (value: string) => void;
  isLoadingAmount: boolean;
}) => {
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
        isLoadingAmount={isLoadingAmount}
        amount={amount}
        setAmount={setAmount}
        setSelectedToken={setToken}
      />
    </View>
  );
};

export default SwapOutputCard;
