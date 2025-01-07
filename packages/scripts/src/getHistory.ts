import {
  HistoryItemType,
  RELAY_RECEIVER_ADDRESSES,
  SwapHistoryItem,
  TransferHistoryItem,
} from '@raylac/shared';
import { client } from './rpc';

const swapHistory = async () => {
  console.time('getHistory');
  const history = await client.getHistory.query({
    addresses: ['0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196'],
  });
  console.timeEnd('getHistory');

  console.log(JSON.stringify(history[0], null, 2));
};

swapHistory();
