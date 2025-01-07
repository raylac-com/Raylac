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
        id: '0x376b25f86be36c498bf3639dd1a70188280be315399525f08344643138700c2c',
        //user: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      },
    }
  );

  console.log(swapInfo);

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
