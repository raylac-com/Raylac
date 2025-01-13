import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import SwapAmountInput from '../SwapAmountInput';
import { Token, TokenAmount } from '@raylac/shared';
import StyledText from '@/components/StyledText/StyledText';
import { useEffect, useState } from 'react';
import ChainSelector from '@/screens/Swap/components/ChainSelector/ChainSelector';
import SearchOutputTokenSheet from '@/components/SearchOutputTokenSheet/SearchOutputTokenSheet';
import Skeleton from '@/components/Skeleton/Skeleton';
import { formatUnits } from 'viem';
import useSelectedCurrency from '@/hooks/useSelectedCurrency';
import { getCurrencyFormattedValue } from '@/lib/utils';

const SwapOutputCard = ({
  token,
  setToken,
  amount,
  setAmount,
  isLoadingAmount,
  chainId,
  setChainId,
}: {
  token: Token | null;
  setToken: (value: Token | null) => void;
  amount: TokenAmount | undefined;
  setAmount: (value: string) => void;
  isLoadingAmount: boolean;
  chainId: number | null;
  setChainId: (value: number | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: selectedCurrency } = useSelectedCurrency();

  useEffect(() => {
    if (token) {
      setToken(token);
    }
  }, [token]);

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
        <ChainSelector
          title="Select output chain"
          token={token}
          chainId={chainId}
          setChainId={setChainId}
        />
      )}
      <SwapAmountInput
        chainId={chainId}
        selectedToken={token}
        isLoadingAmount={isLoadingAmount}
        amount={
          amount && token
            ? formatUnits(BigInt(amount.amount), token.decimals)
            : ''
        }
        setAmount={setAmount}
        onSelectTokenPress={() => {
          setIsOpen(true);
        }}
        canEnterAmount={false}
      />
      {token && (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
        >
          {isLoadingAmount ? (
            <Skeleton style={{ width: 50, height: 20 }} />
          ) : (
            <StyledText
              style={{ color: colors.subbedText, fontWeight: 'bold' }}
            >
              {amount
                ? getCurrencyFormattedValue(amount, selectedCurrency)
                : ''}
            </StyledText>
          )}
          <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
            {selectedCurrency?.toUpperCase()}
          </StyledText>
        </View>
      )}
      <SearchOutputTokenSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSelectToken={token => {
          setToken(token);
          setIsOpen(false);
        }}
      />
    </View>
  );
};

export default SwapOutputCard;
