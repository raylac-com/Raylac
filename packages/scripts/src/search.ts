import { supportedChains } from '@raylac/shared';
import { client } from './rpc';

const search = async () => {
  const supportedTokens = await client.getToken.query({
    tokenAddress: '0x4200000000000000000000000000000000000042',
  });

  console.log(supportedTokens);
};

search();
