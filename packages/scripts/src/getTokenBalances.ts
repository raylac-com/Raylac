import { base, optimism } from 'viem/chains';
import { client } from './rpc';
import {
  ETH,
  getAddressChainTokenBalance,
  getAddressTokenBalances,
  getAlchemyRpcUrl,
  getChainTokenBalance,
  getPerAddressTokenBalance,
  getTokenBalancePerAddress,
  getTotalUsdValue,
  groupTokenBalancesByToken,
  USDC,
} from '@raylac/shared';
import { Alchemy, Network, OwnedToken, TokenBalanceType } from 'alchemy-sdk';
import axios from 'axios';

const getTokenBalancesFromAlchemy = async (address: string) => {
  const url = getAlchemyRpcUrl({ chain: base });

  const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ALCHEMY_API_KEY}`,
  };

  const response = await axios<{
    result: {
      tokens: OwnedToken[];
      pageKey: string;
    };
  }>(url, {
    method: 'post',
    headers: headers,
    data: JSON.stringify({
      method: 'alchemy_getTokenBalances',
      params: [
        address,
        'erc20',
        {
          pageKey: undefined,
        },
      ],
      jsonrpc: '2.0',
    }),
  });

  console.log(response.data);

  return response;
};

const getTokenBalances = async () => {
  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.BASE_MAINNET,
  });

  console.time('getTokenBalances');
  const tokenBalancesRpc = await client.getTokenBalances.query({
    addresses: [
      '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      //      '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
    ],
  });
  console.timeEnd('getTokenBalances');

  console.log('tokenBalances', tokenBalancesRpc[0].balance.currencyValue);
};

getTokenBalances();
