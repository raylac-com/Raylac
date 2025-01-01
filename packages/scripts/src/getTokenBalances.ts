import { base, optimism } from 'viem/chains';
import { client } from './rpc';
import {
  ETH,
  getAddressChainTokenBalance,
  getAddressTokenBalances,
  getChainTokenBalance,
  getPerAddressTokenBalance,
  getTokenBalancePerAddress,
  getTotalUsdValue,
  groupTokenBalancesByToken,
  USDC,
} from '@raylac/shared';

const getTokenBalances = async () => {
  console.time('getTokenBalances');
  const tokenBalances = await client.getTokenBalances.query({
    addresses: [
      '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    ],
  });
  console.timeEnd('getTokenBalances');

  const tokenPrice = await client.getTokenPrice.mutate({
    token: {
      symbol: 'TOILET',
      name: 'Skibidi',
      decimals: 18,
      verified: false,
      addresses: [
        {
          chainId: 8453,
          address: '0x91fAb2D5a448Fb44E3DB836F4EdEAA2310fa5715',
        },
      ],
    },
  });

  console.log(tokenPrice);

  const toilet = tokenBalances.filter(token => token.token.symbol === 'TOILET');
  console.log(JSON.stringify(toilet, null, 2));

  /*
  console.time('groupTokenBalancesByToken');
  const groupedTokenBalances = groupTokenBalancesByToken({
    tokenBalances: tokenBalances,
  });
  console.timeEnd('groupTokenBalancesByToken');
  console.log(groupedTokenBalances);

  const perAddressTokenBalances = getPerAddressTokenBalance({
    tokenBalances: tokenBalances,
    token: USDC,
  });

  console.log(perAddressTokenBalances);

  const tokenBalancesPerAddress = getTokenBalancePerAddress({
    tokenBalances: tokenBalances,
    addresses: [
      '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    ],
  });

  for (const addressTokenBalances of tokenBalancesPerAddress) {
    console.log(addressTokenBalances.address);
    for (const tokenBalance of addressTokenBalances.tokenBalances) {
      console.log(
        ` ${tokenBalance.token.symbol} ${tokenBalance.totalBalance.formatted}`
      );
    }
  }

  const totalUsdValue = getTotalUsdValue(tokenBalances);
  console.log('totalUsdValue', totalUsdValue.toString());
  */
};

getTokenBalances();
