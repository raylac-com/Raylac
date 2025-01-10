import { Hex } from 'viem';
import {
  AlchemyTokenPriceResponse,
  Token,
  DepositStep,
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
  amountIn: TokenAmount;
  amountOut: TokenAmount;
  relayerGas: TokenAmount;
  relayerGasToken: Token;
  relayerServiceFee: TokenAmount;
  relayerServiceFeeToken: Token;
  originChainGas: TokenAmount;
  relayRequestId: Hex;
  totalFeeUsd: string;
  fromChainId: number;
  toChainId: number;
};

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

export enum HistoryItemType {
  TRANSFER = 'transfer',
  BRIDGE_TRANSFER = 'bridge_transfer',
  SWAP = 'swap',
}

export type TransferHistoryItem = {
  type: HistoryItemType.TRANSFER;
  direction: 'outgoing' | 'incoming';
  txHash: Hex;
  from: Hex;
  to: Hex;
  fromChainId: number;
  toChainId: number;
  amount: TokenAmount;
  token: Token;
  timestamp: string;
};

export type BridgeTransferHistoryItem = {
  relayId: string;
  type: HistoryItemType.BRIDGE_TRANSFER;
  direction: 'outgoing' | 'incoming';
  from: Hex;
  to: Hex;
  fromChainId: number;
  toChainId: number;
  amount: TokenAmount;
  token: Token;
  timestamp: string;
  inTxHash: Hex;
  outTxHash: Hex;
};

export type SwapHistoryItem = {
  relayId: string;
  type: HistoryItemType.SWAP;
  address: Hex;
  amountIn: TokenAmount;
  amountOut: TokenAmount;
  tokenIn: Token;
  tokenOut: Token;
  fromChainId: number;
  toChainId: number;
  timestamp: string;
  inTxHash: Hex;
  outTxHash: Hex;
};

export type HistoryItem =
  | TransferHistoryItem
  | BridgeTransferHistoryItem
  | SwapHistoryItem;

export type GetHistoryReturnType = HistoryItem[];

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
  fromChainId: number;
  toChainId: number;
  relayRequestId: Hex;
  steps: DepositStep[];
  transfer: {
    from: Hex;
    to: Hex;
    amount: TokenAmount;
    token: Token;
  };
  originChainGas: TokenAmount;
  relayerServiceFeeToken: Token;
  relayerServiceFee: TokenAmount;
  relayerGas: TokenAmount;
  relayerGasToken: Token;
  amountIn: TokenAmount;
  amountOut: TokenAmount;
  relayerServiceFeeChainId: number;
  relayerGasChainId: number;
  totalFeeUsd: string;
};

export type GetTokenUsdPriceReturnType = number | null;
