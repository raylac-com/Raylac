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
  for (const item of history) {
    if (
      item.relayId ===
      '0x376b25f86be36c498bf3639dd1a70188280be315399525f08344643138700c2c'
    ) {
      console.log(item);
    }
  }
};

swapHistory();
