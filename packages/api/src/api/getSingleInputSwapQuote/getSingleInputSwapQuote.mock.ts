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
    originChainGas: MOCK_TOKEN_AMOUNT,
    amountIn: MOCK_TOKEN_AMOUNT,
    amountOut: MOCK_TOKEN_AMOUNT,
    relayerServiceFeeToken: ETH,
    relayerServiceFee: MOCK_TOKEN_AMOUNT,
    relayerGasToken: ETH,
    relayerGas: MOCK_TOKEN_AMOUNT,
    relayRequestId:
      '0x9876543210987654321098765432109876543210987654321098765432109876' as Hex,
    fromChainId: base.id,
    toChainId: arbitrum.id,
    minimumAmountOut: MOCK_TOKEN_AMOUNT,
    slippagePercent: 1,
  };
};

export default getSingleInputSwapQuoteMock;
