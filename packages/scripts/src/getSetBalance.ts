import { zeroAddress } from 'viem';
import { client } from './rpc';
import { TokenSet } from '@raylac/shared';

const getSetBalance = async () => {
  const balances = await client.getSetBalances.query({
    set: TokenSet.ETH,
    addresses: [
      '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
      '0xD80d35258fCbfD0c6FDB00aC7AC97e0A9E6d17d4',
    ],
  });

  console.log(JSON.stringify(balances, null, 2));
};

getSetBalance();
