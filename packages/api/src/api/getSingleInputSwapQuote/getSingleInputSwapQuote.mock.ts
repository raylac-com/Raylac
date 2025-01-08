import {
  ApproveStep,
  ETH,
  GetSingleInputSwapQuoteRequestBody,
  GetSingleInputSwapQuoteReturnType,
  SwapStep,
} from '@raylac/shared';
import { Hex } from 'viem';

const getSingleInputSwapQuoteMock = async (
  _arg: GetSingleInputSwapQuoteRequestBody
): Promise<GetSingleInputSwapQuoteReturnType> => {
  const mockApproveStep: ApproveStep = {
    tx: {
      data: '0x' as Hex,
      to: '0x1234567890123456789012345678901234567890' as Hex,
      value: '0',
      maxFeePerGas: '1000000000' as Hex,
      maxPriorityFeePerGas: '1000000000' as Hex,
      chainId: 1,
      gas: 300000,
      nonce: 1,
    },
  };

  const mockSwapStep: SwapStep = {
    originChainId: 1,
    destinationChainId: 1,
    tx: {
      data: '0x' as Hex,
      to: '0x1234567890123456789012345678901234567890' as Hex,
      value: '0',
      maxFeePerGas: '1000000000' as Hex,
      maxPriorityFeePerGas: '1000000000' as Hex,
      chainId: 1,
      gas: 300000,
      nonce: 2,
    },
  };

  return {
    approveStep: mockApproveStep,
    swapStep: mockSwapStep,
    originChainGas: {
      amount: '21000',
      formatted: '0.000021',
      usdValue: '0.05',
      usdValueFormatted: '0.05',
      tokenPriceUsd: 2000,
    },
    amountIn: {
      amount: '1000000000000000000',
      formatted: '1',
      usdValue: '2000',
      usdValueFormatted: '2,000',
      tokenPriceUsd: 2000,
    },
    amountOut: {
      amount: '990000000000000000',
      formatted: '0.99',
      usdValue: '1980',
      usdValueFormatted: '1,980',
      tokenPriceUsd: 2000,
    },
    relayerFeeToken: ETH,
    relayerFee: {
      amount: '1000000000000000',
      formatted: '0.001',
      usdValue: '2',
      usdValueFormatted: '2',
      tokenPriceUsd: 2000,
    },
    relayRequestId:
      '0x9876543210987654321098765432109876543210987654321098765432109876' as Hex,
  };
};

export default getSingleInputSwapQuoteMock;
