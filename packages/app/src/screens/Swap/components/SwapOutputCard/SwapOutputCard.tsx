import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import SwapAmountInput from '../SwapAmountInput';
import { SupportedTokensReturnType } from '@raylac/shared';
import StyledText from '@/components/StyledText/StyledText';
import { useSearchOutputTokenSheet } from '@/contexts/SearchOutputTokenSheetContext';
import { useEffect } from 'react';
import ChainSelector from '../ChainSelector/ChainSelector';

const SwapOutputCard = ({
  token,
  setToken,
  amount,
  usdAmount,
  setAmount,
  isLoadingAmount,
  chainId,
  setChainId,
}: {
  token: SupportedTokensReturnType[number] | null;
  setToken: (value: SupportedTokensReturnType[number] | null) => void;
  amount: string;
  usdAmount: number;
  setAmount: (value: string) => void;
  isLoadingAmount: boolean;
  chainId: number | null;
  setChainId: (value: number | null) => void;
}) => {
  const { setIsOpen: setIsOutputTokenOpen, selectedToken } =
    useSearchOutputTokenSheet();

  useEffect(() => {
    if (selectedToken) {
      setToken(selectedToken);
    }
  }, [selectedToken]);

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
        isLoadingAmount={isLoadingAmount}
        amount={amount}
        setAmount={setAmount}
        onSelectTokenPress={() => {
          setIsOutputTokenOpen(true);
        }}
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
