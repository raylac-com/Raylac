import { base, mainnet } from 'viem/chains';
import { client } from './rpc';
import { GetTokenRequestBody } from '@raylac/shared';

const getTokenData = async () => {
  const chainId = mainnet.id;
  const tokenAddress = '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0';

  const requestBody: GetTokenRequestBody = {
    chainId,
    tokenAddress,
  };

  const tokenData = await client.getTokenData.query(requestBody);

  console.log(JSON.stringify(tokenData, null, 2));
};

getTokenData();
