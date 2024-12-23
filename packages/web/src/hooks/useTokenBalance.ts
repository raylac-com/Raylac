import { trpc } from '@/lib/trpc';
import { Token, TokenSet } from '@raylac/shared';
import useAddresses from './useAddresses';

const useTokenBalance = ({ token }: { token?: Token }) => {
  const { data: addresses } = useAddresses();

  const { data: setBalances } = trpc.getSetBalances.useQuery(
    {
      addresses: addresses ?? [],
      set: TokenSet.ETH,
    },
    {
      enabled: addresses !== undefined && addresses.length > 0,
    }
  );

  const balances =
    token && setBalances
      ? setBalances.tokenBalances.find(
          balance => balance.token.symbol === token.symbol
        )
      : undefined;

  return balances;
};

export default useTokenBalance;
