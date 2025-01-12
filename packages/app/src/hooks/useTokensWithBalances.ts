import useTokenBalances from './useTokenBalances';
import BigNumber from 'bignumber.js';
import { Token } from '@raylac/shared';

/**
 * Returns a list of tokens that the user owns
 */
const useTokensWithBalances = (): Token[] | undefined => {
  const { data: tokenBalances } = useTokenBalances();

  return tokenBalances
    ? // Sort by usd value in descending order
      tokenBalances
        .sort((a, b) =>
          new BigNumber(b.balance.usdValue).minus(a.balance.usdValue).toNumber()
        )
        // Map to `Token` type
        .map(balance => balance.token)
        // Remove duplicates
        .filter(
          (token, index, self) =>
            index === self.findIndex(t => t.id === token.id)
        )
    : undefined;
};

export default useTokensWithBalances;
