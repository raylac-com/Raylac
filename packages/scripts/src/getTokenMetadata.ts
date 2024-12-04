import 'dotenv/config';
import { Alchemy, Network } from 'alchemy-sdk';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  throw new Error('ALCHEMY_API_KEY is not set');
}

const getTokenMetadata = async () => {
  const config = {
    apiKey: ALCHEMY_API_KEY,
    network: Network.BASE_MAINNET,
  };
  const alchemy = new Alchemy(config);

  const tokenMetadata = await alchemy.core.getTokenMetadata(
    '0x4ed4e862860bed51a9570b96d89af5e1b0efefed'
  );

  console.log(tokenMetadata);
};

getTokenMetadata();
console.log('Getting token balances');
//getTokenBalances();
