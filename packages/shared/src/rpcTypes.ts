import { Hex } from 'viem';
import {
  AlchemyTokenPriceResponse,
  ExecutionStep,
  RelayGetQuoteResponseBody,
  SignedExecutionStep,
  Token,
  UserOperation,
} from './types';

export enum TRPCErrorMessage {
  SWAP_AMOUNT_TOO_SMALL = 'Swap output amount is too small to cover fees required to execute swap',
  SWAP_NO_ROUTES_FOUND = 'No routes found for the requested swap',
  SWAP_INSUFFICIENT_LIQUIDITY = 'Solver has insufficient liquidity for this swap',
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
  signedBridgeSteps: SignedExecutionStep[];
  signedTransfer: SignedExecutionStep;
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
  bridgeSteps: ExecutionStep[];
  transferStep: ExecutionStep;
}

export interface BuildSwapUserOpRequestBody {
  singerAddress: Hex;
  quote: RelayGetQuoteResponseBody;
}

export interface GetSwapQuoteRequestBody {
  senderAddress: Hex;
  inputs: {
    chainId: number;
    token: Token;
    amount: Hex;
  }[];
  output: {
    chainId: number;
    token: Token;
  };
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
}

export type GetSwapQuoteReturnType = RelayGetQuoteResponseBody;

export interface SubmitSwapRequestBody {
  swapQuote: GetSwapQuoteReturnType;
  signedTxs: {
    chainId: number;
    signedTx: Hex;
    sender: Hex;
  }[];
}

export interface GetTokenPriceRequestBody {
  tokenAddress: Hex;
  chainId: number;
}

export type GetTokenPriceReturnType = AlchemyTokenPriceResponse;

export interface SubmitUserOpsRequestBody {
  userOps: UserOperation[];
  swapQuote: GetSwapQuoteReturnType;
  inputs: {
    chainId: number;
    token: Token;
    amount: Hex;
  }[];
  output: {
    chainId: number;
    token: Token;
  };
}
