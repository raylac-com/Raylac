import {
  ApproveStep,
  ETH,
  GetSingleInputSwapQuoteRequestBody,
  GetSingleInputSwapQuoteReturnType,
  MOCK_TOKEN_AMOUNT,
  SwapStep,
} from '@raylac/shared';
import { Hex } from 'viem';
import { arbitrum, base } from 'viem/chains';

const getSingleInputSwapQuoteMock = async (
  _arg: GetSingleInputSwapQuoteRequestBody
): Promise<GetSingleInputSwapQuoteReturnType> => {
  const mockApproveStep: ApproveStep = {
    id: 'approve',
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
    totalFeeUsd: '0.12',
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
    relayerServiceFeeToken: ETH,
    relayerServiceFee: {
      amount: '1000000000000000',
      formatted: '0.001',
      usdValue: '1',
      usdValueFormatted: '1',
      tokenPriceUsd: 1000,
    },
    relayerGasToken: ETH,
    relayerGas: {
      amount: '1000000000000000',
      formatted: '0.001',
      usdValue: '2',
      usdValueFormatted: '2',
      tokenPriceUsd: 2000,
    },
    relayRequestId:
      '0x9876543210987654321098765432109876543210987654321098765432109876' as Hex,
    fromChainId: base.id,
    toChainId: arbitrum.id,
    minimumAmountOut: MOCK_TOKEN_AMOUNT,
    slippagePercent: 1,
  };
};

export default getSingleInputSwapQuoteMock;
