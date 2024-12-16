import { client } from './rpc';

const swapHistory = async () => {
  const history = await client.getHistory.query({
    address: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
  });
  console.log(history[0]);
};

swapHistory();
