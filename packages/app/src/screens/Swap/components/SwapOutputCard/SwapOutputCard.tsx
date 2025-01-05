import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import SwapAmountInput from '../SwapAmountInput';
import { SupportedTokensReturnType, TokenAmount } from '@raylac/shared';
import StyledText from '@/components/StyledText/StyledText';
import { useEffect, useState } from 'react';
import ChainSelector from '../ChainSelector/ChainSelector';
import SearchOutputTokenSheet from '@/components/SearchOutputTokenSheet/SearchOutputTokenSheet';
import Skeleton from '@/components/Skeleton/Skeleton';

const SwapOutputCard = ({
  token,
  setToken,
  amount,
  setAmount,
  isLoadingAmount,
  chainId,
  setChainId,
}: {
  token: SupportedTokensReturnType[number] | null;
  setToken: (value: SupportedTokensReturnType[number] | null) => void;
  amount: TokenAmount | undefined;
  setAmount: (value: string) => void;
  isLoadingAmount: boolean;
  chainId: number | null;
  setChainId: (value: number | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

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
        <ChainSelector chainId={chainId} setChainId={setChainId} />
      )}
      <SwapAmountInput
        chainId={chainId}
        selectedToken={token}
        isLoadingAmount={isLoadingAmount}
        amount={amount?.formatted ?? ''}
        setAmount={setAmount}
        onSelectTokenPress={() => {
          setIsOpen(true);
        }}
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
              {`${amount?.usdValueFormatted ?? ''}`}
            </StyledText>
          )}
          <StyledText style={{ color: colors.subbedText, fontWeight: 'bold' }}>
            {`USD`}
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
