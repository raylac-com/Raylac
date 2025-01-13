import { ETH, MOCK_TOKEN_AMOUNT } from '@raylac/shared';
import {
  BuildBridgeSendReturnType,
  BuildBridgeSendRequestBody,
} from '@raylac/shared';
import { base } from 'viem/op-stack';
import { arbitrum } from 'viem/chains';

const buildBridgeSend = async (
  _arg: BuildBridgeSendRequestBody
): Promise<BuildBridgeSendReturnType> => {
  const mockData: BuildBridgeSendReturnType = {
    relayRequestId:
      '0x9e48513f41540cc5c297189d8cd66ab432e627a6290cd995955f3c8c2be90c70',
    steps: [],
    transfer: {
      from: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      to: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
      amount: MOCK_TOKEN_AMOUNT,
      token: ETH,
    },
    originChainGas: MOCK_TOKEN_AMOUNT,
    relayerGasChainId: base.id,
    relayerGasToken: ETH,
    relayerGas: MOCK_TOKEN_AMOUNT,
    relayerServiceFeeToken: ETH,
    relayerServiceFee: MOCK_TOKEN_AMOUNT,
    relayerServiceFeeChainId: arbitrum.id,
    amountIn: MOCK_TOKEN_AMOUNT,
    amountOut: MOCK_TOKEN_AMOUNT,
    fromChainId: base.id,
    toChainId: arbitrum.id,
    totalFee: {
      usd: '0.01',
      jpy: '1.2',
    },
  };

  return mockData;
};

export default buildBridgeSend;
