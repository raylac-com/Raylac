import 'dotenv/config';
import { Alchemy, Network } from 'alchemy-sdk';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  throw new Error('ALCHEMY_API_KEY is not set');
}

const getTokenBalances = async () => {
  const networks = [
    Network.ETH_MAINNET,
    Network.ARB_MAINNET,
    Network.BASE_MAINNET,
    Network.OPT_MAINNET,
  ];

  for (const network of networks) {
    const config = {
      apiKey: ALCHEMY_API_KEY,
      network,
    };
    const alchemy = new Alchemy(config);

    const balances = await alchemy.core.getTokenBalances(
      '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8'
    );

    console.log(network, balances);
  }
};

const getTokenMetadata = async () => {
  const config = {
    apiKey: ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(config);

  const metadata = await alchemy.core.getTokenMetadata(
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  );

  console.log(metadata);
};

getTokenMetadata();
console.log('Getting token balances');
//getTokenBalances();
