import { zeroAddress } from 'viem';
import { trpc } from '@/lib/trpc';
import { useAccount } from 'wagmi';
import { Token, TokenSet } from '@raylac/shared';

const useTokenBalance = ({ token }: { token?: Token }) => {
  const { address } = useAccount();

  const { data: setBalances } = trpc.getSetBalances.useQuery({
    address: address || zeroAddress,
    set: TokenSet.ETH,
  });

  const balances =
    token && setBalances
      ? setBalances.balances.find(
          balance => balance.token.symbol === token.symbol
        )
      : undefined;

  return balances;
};

export default useTokenBalance;
