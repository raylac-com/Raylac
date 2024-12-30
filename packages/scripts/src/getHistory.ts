import { client } from './rpc';

const swapHistory = async () => {
  const history = await client.getHistory.query({
    addresses: [
      '0x747C55ff5d029590F911fB304bF617d1Da0cf0BF',
      '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
      '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
    ],
  });
  console.log(JSON.stringify(history, null, 2));
};

swapHistory();
