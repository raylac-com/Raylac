import 'dotenv/config';
import { Alchemy, Network } from 'alchemy-sdk';
import { getCoingeckoClient } from '@raylac/shared';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  throw new Error('ALCHEMY_API_KEY is not set');
}

const getTokenMetadata = async () => {
  const config = {
    apiKey: ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(config);

  const coingecko = getCoingeckoClient();

  const response = await coingecko.get(`/v3/coins/ethereum`);
  console.log(response.data);
};

getTokenMetadata();
console.log('Getting token balances');
//getTokenBalances();
