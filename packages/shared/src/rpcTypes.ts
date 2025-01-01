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
  ApproveStep,
  SwapStep,
  SignedSingleInputSwapStep,
  SignedApproveStep,
  Balance,
} from './types';

export enum TRPCErrorMessage {
  SWAP_AMOUNT_TOO_SMALL = 'Swap output amount is too small to cover fees required to execute swap',
  SWAP_NO_ROUTES_FOUND = 'No routes found for the requested swap',
  SWAP_INSUFFICIENT_LIQUIDITY = 'Solver has insufficient liquidity for this swap',
  INSUFFICIENT_BALANCE = 'Insufficient balance',
}

export type SupportedTokensReturnType = Token[];

export type TokenBalancesReturnType = {
  address: Hex;
  chainId: number;
  token: Token;
  balance: Balance;
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

export interface BuildAggregateSendRequestBody {
  amount: string;
  token: Token;
  fromAddresses: Hex[];
  toAddress: Hex;
  chainId: number;
}

export interface BuildAggregateSendReturnType {
  inputs: {
    tx: {
      to: Hex;
      data: Hex;
      value: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      nonce: number;
      chainId: number;
      gas: number;
    };
  }[];
}

export interface SendAggregateTxRequestBody {
  signedTxs: Hex[];
  chainId: number;
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

export interface GetSingleInputSwapQuoteRequestBody {
  sender: Hex;
  amount: string;
  inputToken: Token;
  outputToken: Token;
  inputChainId: number;
  outputChainId: number;
}

export type GetSingleInputSwapQuoteReturnType = {
  approveStep: ApproveStep | null;
  swapStep: SwapStep;
  amountIn: string;
  amountOut: string;
  amountInFormatted: string;
  amountOutFormatted: string;
  amountInUsd: string;
  amountOutUsd: string;
  relayerServiceFeeUsd: string;
  originChainGasAmountFormatted: string;
  originChainGasUsd: string;
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

export interface SubmitSingleInputSwapRequestBody {
  signedApproveStep: SignedApproveStep | null;
  signedSwapStep: SignedSingleInputSwapStep;
}

export interface GetTokenPriceRequestBody {
  tokenAddress: Hex;
  chainId: number;
}

export type GetTokenPriceReturnType = AlchemyTokenPriceResponse;

export interface GetHistoryRequestBody {
  addresses: Hex[];
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

export enum HistoryItemType {
  OUTGOING = 'outgoing',
  INCOMING = 'incoming',
  MOVE_FUNDS = 'move_funds',
}

export type GetHistoryReturnType = {
  from: Hex;
  to: Hex;
  amount: string;
  token: Token;
  amountUsd: string;
  chainId: number;
  timestamp: string;
  type: HistoryItemType;
}[];

export interface GetEstimatedTransferGasRequestBody {
  chainId: number;
  token: Token;
  to: Hex;
  from: Hex;
  amount: string;
  maxFeePerGas: string;
}

export type GetEstimatedTransferGasReturnType = Balance;

export interface BuildBridgeSendRequestBody {
  from: Hex;
  to: Hex;
  token: Token;
  amount: string;
  fromChainId: number;
  toChainId: number;
}

export type BuildBridgeSendReturnType = {
  steps: CrossChainSwapStep[];
  relayerServiceFeeAmount: string;
  relayerServiceFeeUsd: string;
  amountIn: string;
  amountOut: string;
  amountInFormatted: string;
  amountOutFormatted: string;
  amountInUsd: string;
  amountOutUsd: string;
};

export type GetTokenUsdPriceReturnType = number | 'notfound';
