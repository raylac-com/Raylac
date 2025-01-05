import { supportedChains } from '@raylac/shared';
import { client } from './rpc';

const getSupportedTokens = async () => {
  const supportedTokens = await client.getSupportedTokens.query({
    chainIds: supportedChains.map(chain => chain.id),
    searchTerm: '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb',
  });
  console.log(supportedTokens.map(token => token.addresses));
};

getSupportedTokens();
