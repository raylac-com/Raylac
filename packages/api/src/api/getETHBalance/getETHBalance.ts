import {
  formatAmount,
  formatUsdValue,
  getPublicClient,
  supportedChains,
} from '@raylac/shared';
import { Hex, zeroAddress } from 'viem';
import getTokenPrice from '../getTokenPrice/getTokenPrice';
import { mainnet } from 'viem/chains';
import BigNumber from 'bignumber.js';

const getETHBalance = async ({ address }: { address: Hex }) => {
  const chainIds = supportedChains.map(chain => chain.id);

  const ethPrice = await getTokenPrice({
    chainId: mainnet.id,
    tokenAddress: zeroAddress,
  });

  const ethPriceUsd = ethPrice.prices.find(p => p.currency === 'usd');

  if (!ethPriceUsd) {
    throw new Error('ETH price not found');
  }

  const balances = await Promise.all(
    chainIds.map(async chainId => {
      const publicClient = getPublicClient({ chainId });

      const balance = await publicClient.getBalance({ address });

      const balanceFormatted = formatAmount(balance.toString(), 18);

      const balanceUsd = new BigNumber(balanceFormatted).multipliedBy(
        new BigNumber(ethPriceUsd.value)
      );

      return {
        balance,
        balanceFormatted,
        balanceUsd,
        chain: chainId,
      };
    })
  );

  const totalBalance = balances.reduce((acc, balance) => {
    return acc + balance.balance;
  }, BigInt(0));

  const totalBalanceFormatted = formatAmount(totalBalance.toString(), 18);

  const totalBalanceUsd = balances.reduce((acc, balance) => {
    return acc.plus(balance.balanceUsd);
  }, new BigNumber(0));

  return {
    balances: balances.map(balance => ({
      balance: balance.balance.toString(),
      balanceFormatted: balance.balanceFormatted,
      balanceUsd: formatUsdValue(balance.balanceUsd),
      chain: balance.chain,
    })),
    totalBalanceFormatted,
    totalBalanceUsd: formatUsdValue(totalBalanceUsd),
  };
};

export default getETHBalance;
