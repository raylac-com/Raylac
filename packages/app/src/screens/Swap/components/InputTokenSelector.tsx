import { trpc } from '@/lib/trpc';
import { View } from 'react-native';
import colors from '@/lib/styles/colors';
import { useEffect } from 'react';
import { supportedChains } from '@raylac/shared';
import { SupportedToken } from '@/types';
import TokenSelector from './TokenSelector';

const InputTokenSelector = ({
  token,
  setToken,
  amount,
  setAmount,
}: {
  token: SupportedToken;
  setToken: (value: SupportedToken) => void;
  amount: string;
  setAmount: (value: string) => void;
}) => {
  const { data: supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

  useEffect(() => {
    if (supportedTokens && supportedTokens.length > 0) {
      setToken(supportedTokens[0]);
    }
  }, [supportedTokens]);

  return (
    <View
      style={{
        flexDirection: 'column',
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <TokenSelector token={token} amount={amount} setAmount={setAmount} />
    </View>
  );
};

export default InputTokenSelector;
