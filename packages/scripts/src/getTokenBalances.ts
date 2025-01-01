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

const getTokenBalances = async () => {
  console.time('getTokenBalances');
  const tokenBalances = await client.getTokenBalances.query({
    addresses: [
      //      '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    ],
  });
  console.timeEnd('getTokenBalances');
  console.time('groupTokenBalancesByToken');
  const groupedTokenBalances = groupTokenBalancesByToken({
    tokenBalances: tokenBalances,
  });
  console.timeEnd('groupTokenBalancesByToken');
  console.log(groupedTokenBalances);

  const totalUsdValue = getTotalUsdValue(tokenBalances);
  console.log('totalUsdValue', totalUsdValue.toString());
};

getTokenBalances();
