import {
  formatAmount,
  formatUsdValue,
  getERC20TokenBalance,
} from '@raylac/shared';
import { formatEther, Hex } from 'viem';
import { KNOWN_TOKENS } from '../../lib/knownTokes';
import getTokenPrice from '../getTokenPrice/getTokenPrice';
import BigNumber from 'bignumber.js';

const getStakedBalance = async ({ address }: { address: Hex }) => {
  const wstToken = KNOWN_TOKENS.find(token => token.symbol === 'wstETH');

  if (!wstToken) {
    throw new Error('wstETH token not found');
  }

  const wstPrice = await getTokenPrice({
    chainId: wstToken.addresses[0].chainId,
    tokenAddress: wstToken.addresses[0].address,
  });

  const wstPriceUsd = wstPrice.prices.find(p => p.currency === 'usd');

  if (!wstPriceUsd) {
    throw new Error('wstETH price not found');
  }

  const balances = (
    await Promise.all(
      wstToken.addresses.map(async contractAddress => {
        const stakedBalance = await getERC20TokenBalance({
          address,
          contractAddress: contractAddress.address,
          chainId: contractAddress.chainId,
        });

        const balanceFormatted = formatAmount(stakedBalance.toString(), 18);
        const balanceUsd = new BigNumber(
          formatEther(stakedBalance)
        ).multipliedBy(new BigNumber(wstPriceUsd.value));

        return {
          balance: stakedBalance.toString(),
          chain: contractAddress.chainId,
          balanceFormatted,
          balanceUsd: formatUsdValue(balanceUsd),
        };
      })
    )
  ).filter(balance => BigInt(balance.balance) > BigInt(0));

  const totalBalance = balances.reduce(
    (acc, curr) => acc + BigInt(curr.balance),
    BigInt(0)
  );

  const totalBalanceFormatted = formatAmount(totalBalance.toString(), 18);

  const totalBalanceUsd = new BigNumber(formatEther(totalBalance)).multipliedBy(
    new BigNumber(wstPriceUsd.value)
  );

  return {
    balances,
    totalBalanceFormatted,
    totalBalanceUsd: formatUsdValue(totalBalanceUsd),
  };
};

export default getStakedBalance;
