import 'dotenv/config';
import { Alchemy, Network } from 'alchemy-sdk';

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

  const metadata = await alchemy.core.getTokenMetadata(
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  );

  console.log(metadata);
};

getTokenMetadata();
console.log('Getting token balances');
//getTokenBalances();