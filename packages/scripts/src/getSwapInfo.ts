import { RelayGetRequestsReturnType } from '@raylac/shared';
import axios from 'axios';

const getSwapInfo = async () => {
  const relayApi = axios.create({
    baseURL: 'https://api.relay.link',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const swapInfo = await relayApi.get<RelayGetRequestsReturnType>(
    'requests/v2',
    {
      params: {
        hash: '0xe143e4b4b745e4a7d59e73d7ced357051ad62804f80ba3259ad7c6ea74db97ff',
        //user: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      },
    }
  );

  /*
  const request = swapInfo.data.requests[0];

  console.log(request.data.metadata.sender);
  console.log(request.data.metadata.recipient);
  console.log(request.data.metadata.currencyIn);
  console.log(request.data.metadata.currencyOut);
  console.log(request.data.inTxs[0].hash);
  console.log(request.data.outTxs[0].hash);
  console.log(request.id);
  */
  console.log(JSON.stringify(swapInfo.data, null, 2));
};

getSwapInfo();
