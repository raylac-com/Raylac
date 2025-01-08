import {
  BuildSendRequestBody,
  BuildSendReturnType,
  ETH,
  MOCK_TOKEN_AMOUNT,
} from '@raylac/shared';
import { zeroAddress } from 'viem';

const buildSendMock = async (
  _requestBody: BuildSendRequestBody
): Promise<BuildSendReturnType> => {
  const mockData: BuildSendReturnType = {
    tx: {
      to: zeroAddress,
      data: '0x',
      value: '0',
      maxFeePerGas: '1000000000000000000',
      maxPriorityFeePerGas: '1000000000000000000',
      nonce: 1,
      chainId: 1,
      gas: 1000000,
    },
    transfer: {
      from: zeroAddress,
      to: zeroAddress,
      amount: MOCK_TOKEN_AMOUNT,
      token: ETH,
      gasFee: MOCK_TOKEN_AMOUNT,
    },
  };

  return mockData;
};

export default buildSendMock;
