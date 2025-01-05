import { supportedChains } from '@raylac/shared';
import { client } from './rpc';

const getSupportedTokens = async () => {
  const supportedTokens = await client.getSupportedTokens.query({
    chainIds: supportedChains.map(chain => chain.id),
    searchTerm: 'USDC',
  });
  console.log(supportedTokens.map(token => token.addresses));
};

getSupportedTokens();
