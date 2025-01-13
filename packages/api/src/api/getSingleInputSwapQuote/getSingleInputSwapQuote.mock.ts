import {
  ApproveStep,
  ETH,
  GetSingleInputSwapQuoteRequestBody,
  GetSingleInputSwapQuoteReturnType,
  MOCK_TOKEN_AMOUNT,
  SwapStep,
  TokenAmount,
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
    originChainGas: {
      amount: '21000',
      formatted: '0.000021',
      tokenPrice: {
        usd: '2000',
        jpy: '280000',
      },
      currencyValue: {
        raw: {
          usd: '0.05',
          jpy: '7',
        },
        formatted: {
          usd: '0.05',
          jpy: '7',
        },
      },
    } satisfies TokenAmount,
    amountIn: {
      amount: '1000000000000000000',
      formatted: '1',
      tokenPrice: {
        usd: '2000',
        jpy: '280000',
      },
      currencyValue: {
        raw: {
          usd: '2000',
          jpy: '280000',
        },
        formatted: {
          usd: '2,000',
          jpy: '280,000',
        },
      },
    } satisfies TokenAmount,
    amountOut: {
      amount: '990000000000000000',
      formatted: '0.99',
      tokenPrice: {
        usd: '2000',
        jpy: '280000',
      },
      currencyValue: {
        raw: {
          usd: '1980',
          jpy: '277200',
        },
        formatted: {
          usd: '1,980',
          jpy: '277,200',
        },
      },
    } satisfies TokenAmount,
    relayerServiceFeeToken: ETH,
    relayerServiceFee: {
      amount: '1000000000000000',
      formatted: '0.001',
      tokenPrice: {
        usd: '1000',
        jpy: '140000',
      },
      currencyValue: {
        raw: {
          usd: '1',
          jpy: '140',
        },
        formatted: {
          usd: '1',
          jpy: '140',
        },
      },
    } satisfies TokenAmount,
    relayerGasToken: ETH,
    relayerGas: {
      amount: '1000000000000000',
      formatted: '0.001',
      tokenPrice: {
        usd: '2000',
        jpy: '280000',
      },
      currencyValue: {
        raw: {
          usd: '2',
          jpy: '280',
        },
        formatted: {
          usd: '2',
          jpy: '280',
        },
      },
    } satisfies TokenAmount,
    relayRequestId:
      '0x9876543210987654321098765432109876543210987654321098765432109876' as Hex,
    fromChainId: base.id,
    toChainId: arbitrum.id,
    minimumAmountOut: MOCK_TOKEN_AMOUNT,
    slippagePercent: 1,
  };
};

export default getSingleInputSwapQuoteMock;
