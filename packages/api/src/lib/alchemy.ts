import { Alchemy, Network } from 'alchemy-sdk';

// Optional config object, but defaults to the API key 'demo' and Network 'eth-mainnet'.
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API key.
  network: Network.BASE_SEPOLIA, // Replace with your network.
};

const alchemy = new Alchemy(settings);

export default alchemy;
