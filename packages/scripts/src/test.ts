import { client } from './rpc';

const test = async () => {
  console.time('test');
  const tokenBalances = await client.getTokenBalances.query({
    address: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
  });
  console.timeEnd('test');

  for (const balance of tokenBalances) {
    console.log(balance);
  }

  console.log(tokenBalances.length);
};

test();
