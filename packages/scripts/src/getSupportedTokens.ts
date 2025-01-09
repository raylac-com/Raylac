import { supportedChains } from '@raylac/shared';
import { client } from './rpc';

const getSupportedTokens = async () => {
  const supportedTokens = await client.getSupportedTokens.query({
    searchTerm: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    chainIds: supportedChains.map(chain => chain.id),
  });
  console.log(JSON.stringify(supportedTokens, null, 2));
};

getSupportedTokens();
