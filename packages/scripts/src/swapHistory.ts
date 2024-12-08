import { client } from './rpc';

const swapHistory = async () => {
  const history = await client.getSwapHistory.query({
    address: '0x53e4957e950C0f781190bc789F328d790f947f38',
  });
  console.log(history);
};

swapHistory();
