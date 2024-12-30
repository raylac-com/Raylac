import { optimism } from 'viem/chains';
import { client } from './rpc';

const getTokenBalances = async () => {
  const tokenBalances = await client.getTokenBalances.query({
    addresses: ['0x400EA6522867456E988235675b9Cb5b1Cf5b79C8'],
  });

  for (const tokenBalance of tokenBalances) {
    console.log(tokenBalance.token.symbol);
    console.log(JSON.stringify(tokenBalance.combinedBreakdown, null, 2));
    console.log(JSON.stringify(tokenBalance.perAddressBreakdown, null, 2));
  }
};

getTokenBalances();
