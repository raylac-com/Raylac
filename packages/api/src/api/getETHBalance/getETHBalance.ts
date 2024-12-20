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
        balance: balance.toString(),
        balanceFormatted,
        balanceUsd: formatUsdValue(balanceUsd),
        chain: chainId,
      };
    })
  );

  return balances;
};

export default getETHBalance;
