import { base, optimism } from 'viem/chains';
import { client } from './rpc';
import {
  ETH,
  getAddressChainTokenBalance,
  getAddressTokenBalances,
  getChainTokenBalance,
  getTotalUsdValue,
  groupTokenBalancesByToken,
  USDC,
} from '@raylac/shared';

const getTokenPrice = async () => {
  console.time('getTokenPrice');
  const tokenPrice = await client.getTokenPrice.mutate({
    token: USDC,
  });
  console.timeEnd('getTokenPrice');

  console.log(tokenPrice);

  /*
  console.time('groupTokenBalancesByToken');
  const groupedTokenBalances = groupTokenBalancesByToken({
    tokenBalances: tokenBalances,
  });
  console.timeEnd('groupTokenBalancesByToken');
  console.log(groupedTokenBalances);

  const totalUsdValue = getTotalUsdValue(tokenBalances);
  console.log('totalUsdValue', totalUsdValue.toString());
  */
};

getTokenPrice();
