import { formatUsdValue, TokenSet } from '@raylac/shared';
import { Hex } from 'viem';
import { getTokensInSet } from '../../utils';
import { getTokenMultiChainBalance } from '../../lib/utils';
import BigNumber from 'bignumber.js';

const getSetBalances = async ({
  set,
  address,
}: {
  set: TokenSet;
  address: Hex;
}) => {
  const tokens = getTokensInSet(set);

  const balances = await Promise.all(
    tokens.map(async token => {
      const balance = await getTokenMultiChainBalance({ token, address });
      return {
        ...balance,
        token,
      };
    })
  );

  const totalBalanceUsd = balances.reduce(
    (acc, curr) => acc.plus(new BigNumber(curr.totalBalanceUsd)),
    new BigNumber(0)
  );

  const totalBalanceUsdFormatted = formatUsdValue(totalBalanceUsd);

  return {
    balances,
    totalBalanceUsd: totalBalanceUsd.toNumber(),
    totalBalanceUsdFormatted,
  };
};

export default getSetBalances;
