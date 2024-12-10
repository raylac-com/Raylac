import { supportedChains } from '@raylac/shared';
import { client } from './rpc';

const search = async () => {
  const supportedTokens = await client.getSupportedTokens.query({
    chainIds: supportedChains.map(chain => chain.id),
    searchTerm: 'clank',
  });

  console.log(supportedTokens);
};

search();
