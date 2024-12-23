import { zeroAddress } from 'viem';
import { trpc } from '@/lib/trpc';
import { useAccount } from 'wagmi';
import { Token, TokenSet } from '@raylac/shared';

const useChainBalance = ({
  token,
  chainId,
}: {
  token: Token;
  chainId: number;
}) => {
  const { address } = useAccount();

  const { data: setBalances } = trpc.getSetBalances.useQuery({
    address: address || zeroAddress,
    set: TokenSet.ETH,
  });
  const balance = setBalances?.balances
    .find(balance => balance.token.symbol === token.symbol)
    ?.balances.find(balance => balance.chain === chainId);

  return {
    balance,
  };
};

export default useChainBalance;
