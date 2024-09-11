import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';
import useIsSignedIn from './useIsSignedIn';

const useAggregatedTokenBalances = () => {
  const { data: isSignedIn } = useIsSignedIn();
  const [aggregatedTokenBalances, setAggregatedTokenBalances] = useState<
    Record<string, bigint> | null
  >(null);

  const { data: tokenBalancesPerChain } =
    trpc.getTokenBalancesPerChain.useQuery(null, {
      enabled: isSignedIn,
      refetchOnWindowFocus: true,
    });

  useEffect(() => {
    if (tokenBalancesPerChain) {
      const _aggregatedTokenBalances = {};

      // Compute the sum of token balances across all chains
      for (const tokenBalance of tokenBalancesPerChain) {
        const tokenId = tokenBalance.tokenId;
        const _balance = _aggregatedTokenBalances[tokenId];

        if (_balance) {
          _aggregatedTokenBalances[tokenId] =
            _balance + BigInt(tokenBalance.balance);
        } else {
          _aggregatedTokenBalances[tokenId] = BigInt(tokenBalance.balance);
        }
      }

      setAggregatedTokenBalances(_aggregatedTokenBalances);
    }
  }, [tokenBalancesPerChain]);

  return { aggregatedTokenBalances };
};

export default useAggregatedTokenBalances;
