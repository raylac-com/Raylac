import { client } from './rpc';

const swapHistory = async () => {
  const history = await client.getHistory.query({
    addresses: ['0x400EA6522867456E988235675b9Cb5b1Cf5b79C8'],
  });
  console.log(JSON.stringify(history, null, 2));
};

swapHistory();
