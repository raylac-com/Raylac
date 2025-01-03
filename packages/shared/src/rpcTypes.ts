import { Hex } from 'viem';
import {
  AlchemyTokenPriceResponse,
  Token,
  SignedCrossChainSwapStep,
  SwapOutput,
  SwapInput,
  CrossChainSwapStep,
  ApproveStep,
  SwapStep,
  SignedSingleInputSwapStep,
  SignedApproveStep,
  TokenAmount,
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
  balance: TokenAmount;
}[];

export interface BuildMultiChainSendRequestBody {
  amount: string;
  token: Token;
  sender: Hex;
  to: Hex;
  destinationChainId: number;
}

export interface BuildSendRequestBody {
  amount: string;
  token: Token;
  fromAddress: Hex;
  toAddress: Hex;
  chainId: number;
}

export interface BuildSendReturnType {
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
  transfer: {
    from: Hex;
    to: Hex;
    amount: TokenAmount;
    token: Token;
    gasFee: TokenAmount;
  };
}

export interface SendTxRequestBody {
  signedTx: Hex;
  chainId: number;
  transfer: {
    from: Hex;
    to: Hex;
    amount: TokenAmount;
    token: Token;
  };
}

export interface SendBridgeTxRequestBody {
  signedTxs: Hex[];
  chainId: number;
  transfer: {
    from: Hex;
    to: Hex;
    amount: TokenAmount;
    token: Token;
  };
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
  PENDING = 'pending',
}

export type GetHistoryReturnType = {
  from: Hex;
  to: Hex;
  token: Token;
  chainId: number;
  amount: TokenAmount;
  timestamp: string;
  type: HistoryItemType;
  txHash: Hex;
}[];

export interface GetEstimatedTransferGasRequestBody {
  chainId: number;
  token: Token;
  to: Hex;
  from: Hex;
  amount: string;
  maxFeePerGas: string;
}

export type GetEstimatedTransferGasReturnType = TokenAmount;

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
  transfer: {
    from: Hex;
    to: Hex;
    amount: TokenAmount;
    token: Token;
  };
  originChainGas: TokenAmount;
  relayerServiceFeeToken: Token;
  relayerServiceFee: TokenAmount;
  amountIn: TokenAmount;
  amountOut: TokenAmount;
  relayerFeeChainId: number;
};

export type GetTokenUsdPriceReturnType = number | null;
