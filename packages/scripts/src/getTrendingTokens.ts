import { client } from './rpc';

const getTrendingTokens = async () => {
  const trendingTokens = await client.getTrendingTokens.query();
  console.log(trendingTokens);
};

getTrendingTokens();
