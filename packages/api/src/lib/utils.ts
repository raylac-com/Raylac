import {
  formatAmount,
  formatUsdValue,
  getERC20TokenBalance,
  getPublicClient,
  Token,
} from '@raylac/shared';

import { ChainGasInfo } from '@raylac/shared';
import { getMaxPriorityFeePerGas } from './erc4337';
import { formatUnits, Hex, zeroAddress } from 'viem';
import getTokenPrice from '../api/getTokenPrice/getTokenPrice';
import BigNumber from 'bignumber.js';

/**
 * Get the gas info for all supported chains
 */
export const getGasInfo = async ({
  chainIds,
}: {
  chainIds: number[];
}): Promise<ChainGasInfo[]> => {
  const gasInfo: ChainGasInfo[] = [];
  for (const chainId of chainIds) {
    const client = getPublicClient({ chainId });
    const block = await client.getBlock({ blockTag: 'latest' });
    const maxPriorityFeePerGas = await getMaxPriorityFeePerGas({ chainId });

    if (block.baseFeePerGas === null) {
      throw new Error('baseFeePerGas is null');
    }

    gasInfo.push({
      chainId,
      baseFeePerGas: block.baseFeePerGas,
      maxPriorityFeePerGas,
    });
  }

  return gasInfo;
};

export const getNonce = async ({
  chainId,
  address,
}: {
  chainId: number;
  address: Hex;
}) => {
  const publicClient = getPublicClient({
    chainId,
  });

  return await publicClient.getTransactionCount({
    address,
  });
};

const getETHBalance = async ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const publicClient = getPublicClient({ chainId });
  return await publicClient.getBalance({ address });
};

export const getTokenMultiChainBalance = async ({
  token,
  address,
}: {
  token: Token;
  address: Hex;
}) => {
  const tokenPrice = await getTokenPrice({
    chainId: token.addresses[0].chainId,
    tokenAddress: token.addresses[0].address,
  });

  const priceUsd = tokenPrice.prices.find(p => p.currency === 'usd');

  if (!priceUsd) {
    throw new Error(`${token.symbol} price not found`);
  }

  const chainBalances = (
    await Promise.all(
      token.addresses.map(async contractAddress => {
        const balance =
          contractAddress.address === zeroAddress
            ? await getETHBalance({
                address,
                chainId: contractAddress.chainId,
              })
            : await getERC20TokenBalance({
                address,
                contractAddress: contractAddress.address,
                chainId: contractAddress.chainId,
              });

        const balanceFormatted = formatAmount(
          balance.toString(),
          token.decimals
        );
        const balanceUsd = new BigNumber(
          formatUnits(balance, token.decimals)
        ).multipliedBy(new BigNumber(priceUsd.value));

        return {
          balance: balance.toString(),
          chain: contractAddress.chainId,
          balanceFormatted,
          balanceUsd: formatUsdValue(balanceUsd),
        };
      })
    )
  )
    .filter(balance => BigInt(balance.balance) > BigInt(0))
    .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));

  const totalBalance = chainBalances.reduce(
    (acc, curr) => acc + BigInt(curr.balance),
    BigInt(0)
  );

  const totalBalanceFormatted = formatAmount(
    totalBalance.toString(),
    token.decimals
  );

  const totalBalanceUsd = new BigNumber(
    formatUnits(totalBalance, token.decimals)
  ).multipliedBy(new BigNumber(priceUsd.value));

  const totalBalanceUsdFormatted = formatUsdValue(totalBalanceUsd);

  return {
    chainBalances,
    totalBalance,
    totalBalanceFormatted,
    totalBalanceUsd: totalBalanceUsd,
    totalBalanceUsdFormatted,
  };
};
