import { optimism } from 'viem/chains';
import { client } from './rpc';

const getTokenBalances = async () => {
  const tokenBalances = await client.getTokenBalances.query({
    address: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
  });

  console.log(tokenBalances);
};

getTokenBalances();
