import { formatAmount, formatUsdValue, TokenSet } from '@raylac/shared';
import { Hex } from 'viem';
import { getTokensInSet } from '../../utils';
import { getTokenMultiChainBalance } from '../../lib/utils';
import BigNumber from 'bignumber.js';

const getAddressBalances = async ({
  set,
  address,
}: {
  set: TokenSet;
  address: Hex;
}) => {
  const tokens = getTokensInSet(set);

  const tokenBalances = (
    await Promise.all(
      tokens.map(async token => {
        const balance = await getTokenMultiChainBalance({ token, address });
        return {
          ...balance,
          token,
        };
      })
    )
  ).sort((a, b) => (b.totalBalance > a.totalBalance ? 1 : -1));

  const totalBalanceUsd = tokenBalances.reduce(
    (acc, curr) => acc.plus(new BigNumber(curr.totalBalanceUsd)),
    new BigNumber(0)
  );

  const totalBalanceUsdFormatted = formatUsdValue(totalBalanceUsd);

  return {
    tokenBalances,
    totalBalanceUsd: totalBalanceUsd.toNumber(),
    totalBalanceUsdFormatted,
  };
};

const getSetBalances = async ({
  set,
  addresses,
}: {
  set: TokenSet;
  addresses: Hex[];
}) => {
  const addressBalances = await Promise.all(
    addresses.map(async address => {
      const balance = await getAddressBalances({ set, address });

      return {
        ...balance,
        address,
      };
    })
  );

  const tokens = getTokensInSet(set);

  const tokenBalances = tokens.map(token => {
    const balances = addressBalances
      .flatMap(balance => balance.tokenBalances)
      .filter(tb => tb.token.symbol === token.symbol);

    const totalBalance = balances.reduce(
      (acc, curr) => acc + BigInt(curr.totalBalance),
      BigInt(0)
    );

    const totalBalanceFormatted = formatAmount(
      totalBalance.toString(),
      token.decimals
    );

    const totalBalanceUsd = balances.reduce(
      (acc, curr) => acc.plus(new BigNumber(curr.totalBalanceUsd)),
      new BigNumber(0)
    );

    const totalBalanceUsdFormatted = formatUsdValue(totalBalanceUsd);

    return {
      addressBalances: addressBalances.map(balance => {
        const addressTokenBalance = balance.tokenBalances.find(
          tb => tb.token.symbol === token.symbol
        );

        return {
          ...addressTokenBalance,
          address: balance.address,
        };
      }),
      token,
      totalBalanceFormatted,
      totalBalanceUsd,
      totalBalanceUsdFormatted,
    };
  });

  const totalBalanceUsd = tokenBalances.reduce(
    (acc, curr) => acc.plus(new BigNumber(curr.totalBalanceUsd)),
    new BigNumber(0)
  );

  const totalBalanceUsdFormatted = formatUsdValue(totalBalanceUsd);

  return {
    tokenBalances,
    totalBalanceUsd: totalBalanceUsd.toNumber(),
    totalBalanceUsdFormatted,
  };
};

export default getSetBalances;
