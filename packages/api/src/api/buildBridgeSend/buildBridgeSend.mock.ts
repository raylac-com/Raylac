import { ETH } from '@raylac/shared';
import {
  BuildBridgeSendReturnType,
  BuildBridgeSendRequestBody,
} from '@raylac/shared';

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
      amount: {
        amount: '1000000000000000000',
        formatted: '1',
        usdValue: '3362.3198755114',
        usdValueFormatted: '3,362',
        tokenPriceUsd: 3362.3198755114,
      },
      token: ETH,
    },
    originChainGas: {
      amount: '588940753125',
      formatted: '0.00000059',
      usdValue: '0.001980207199730840160523125',
      usdValueFormatted: '0.0020',
      tokenPriceUsd: 3362.3198755114,
    },
    relayerFeeChainId: 8453,
    relayerServiceFeeToken: ETH,
    relayerServiceFee: {
      amount: '200675021600000',
      formatted: '0.00020',
      usdValue: '0.67473361364435950604624',
      usdValueFormatted: '0.67',
      tokenPriceUsd: 3362.3198755114,
    },
    amountIn: {
      amount: '1000000000000000000',
      formatted: '1',
      usdValue: '3362.3198755114',
      usdValueFormatted: '3,362',
      tokenPriceUsd: 3362.3198755114,
    },
    amountOut: {
      amount: '999799324978400000',
      formatted: '1',
      usdValue: '3361.64514189775564049395376',
      usdValueFormatted: '3,362',
      tokenPriceUsd: 3362.3198755114,
    },
  };

  return mockData;
};

export default buildBridgeSend;
