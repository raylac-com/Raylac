import { Hex } from 'viem';
import {
  AlchemyTokenPriceResponse,
  BridgeStep,
  SignedBridgeStep,
  SignedTransferStep,
  TransferStep,
  Token,
  SignedCrossChainSwapStep,
  SwapOutput,
  SwapInput,
  CrossChainSwapStep,
} from './types';

export enum TRPCErrorMessage {
  SWAP_AMOUNT_TOO_SMALL = 'Swap output amount is too small to cover fees required to execute swap',
  SWAP_NO_ROUTES_FOUND = 'No routes found for the requested swap',
  SWAP_INSUFFICIENT_LIQUIDITY = 'Solver has insufficient liquidity for this swap',
  INSUFFICIENT_BALANCE = 'Insufficient balance',
}

export type SupportedTokensReturnType = Token[];

export type TokenBalancesReturnType = {
  token: Token;
  balance: Hex;
  usdValue: string;
  tokenPrice: string;
  breakdown: {
    chainId: number;
    balance: Hex;
    tokenAddress: Hex;
    usdValue: string;
  }[];
}[];

export interface SendTransactionRequestBody {
  signedBridgeSteps: SignedBridgeStep[];
  signedTransfer: SignedTransferStep;
  sender: Hex;
  token: Token;
  amount: string;
}

export interface BuildMultiChainSendRequestBody {
  amount: string;
  token: Token;
  sender: Hex;
  to: Hex;
  destinationChainId: number;
}

export interface BuildMultiChainSendReturnType {
  inputAmount: string;
  inputAmountFormatted: string;
  inputAmountUsd: string;
  outputAmount: string;
  outputAmountFormatted: string;
  bridgeFee: string;
  bridgeFeeFormatted: string;
  bridgeFeeUsd: string;
  outputAmountUsd: string;
  bridgeSteps: BridgeStep[];
  transferStep: TransferStep;
}

export interface GetSwapQuoteRequestBody {
  sender: Hex;
  amount: string;
  inputToken: Token;
  outputToken: Token;
  chainId?: number;
}

export type GetSwapQuoteReturnType = {
  inputs: SwapInput[];
  output: SwapOutput;
  swapSteps: CrossChainSwapStep[];
  relayerServiceFeeAmount: string;
  relayerServiceFeeUsd: string;
  amountIn: string;
  amountOut: string;
  amountInFormatted: string;
  amountOutFormatted: string;
  amountInUsd: string;
  amountOutUsd: string;
};

export interface GetSingleChainSwapQuoteRequestBody {
  sender: Hex;
  amount: string;
  inputToken: Token;
  outputToken: Token;
  chainId: number;
}

export type GetSingleChainSwapQuoteReturnType = {
  swapSteps: CrossChainSwapStep[];
  relayerServiceFeeAmount: string;
  relayerServiceFeeUsd: string;
  amountIn: string;
  amountOut: string;
  amountInFormatted: string;
  amountOutFormatted: string;
  amountInUsd: string;
  amountOutUsd: string;
};

export interface SubmitSwapRequestBody {
  sender: Hex;
  signedSwapSteps: SignedCrossChainSwapStep[];
  amountIn: string;
  amountOut: string;
  amountInUsd: string;
  amountOutUsd: string;
  tokenIn: Token;
  tokenOut: Token;
  relayerServiceFeeAmount: string;
  relayerServiceFeeUsd: string;
}

export interface SubmitSingleChainSwapRequestBody {
  signedSwapSteps: SignedCrossChainSwapStep[];
}

export interface GetTokenPriceRequestBody {
  tokenAddress: Hex;
  chainId: number;
}

export type GetTokenPriceReturnType = AlchemyTokenPriceResponse;

export interface GetHistoryRequestBody {
  address: Hex;
}

export type TransferHistoryItem = {
  txHash: Hex;
  from: Hex;
  to: Hex;
  destinationChainId: number;
  amount: string;
  amountUsd: string;
  bridges: {
    txHash: Hex;
    toChainId: number;
    fromChainId: number;
    amountIn: string;
    amountOut: string;
    bridgeFeeAmount: string;
    bridgeFeeUsd: string;
  }[];
  token: Token;
};

export type SwapHistoryItem = {
  lineItems: {
    txHash: Hex;
    fromChainId: number;
    toChainId: number;
  }[];
  address: Hex;
  amountIn: string;
  amountOut: string;
  amountInUsd: string;
  amountOutUsd: string;
  tokenIn: Token;
  tokenOut: Token;
  amountInFormatted: string;
  amountOutFormatted: string;
};

export type HistoryItem = TransferHistoryItem | SwapHistoryItem;

export type GetHistoryReturnType = HistoryItem[];
