import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import SwapAmountInput from '../SwapAmountInput';
import { SupportedTokensReturnType } from '@raylac/shared';
import StyledText from '@/components/StyledText/StyledText';

const SwapOutputCard = ({
  token,
  setToken,
  amount,
  usdAmount,
  setAmount,
  isLoadingAmount,
}: {
  token: SupportedTokensReturnType[number] | null;
  setToken: (value: SupportedTokensReturnType[number] | null) => void;
  amount: string;
  usdAmount: number;
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
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
      >
        <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
          {`${usdAmount}`}
        </StyledText>
        <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
          {`USD`}
        </StyledText>
      </View>
    </View>
  );
};

export default SwapOutputCard;
