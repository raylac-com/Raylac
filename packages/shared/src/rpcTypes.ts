import { Hex } from 'viem';
import {
  AlchemyTokenPriceResponse,
  RelayGetQuoteResponseBody,
  UserOperation,
} from './types';

export enum TRPCErrorMessage {
  SWAP_AMOUNT_TOO_SMALL = 'Swap output amount is too small to cover fees required to execute swap',
  SWAP_NO_ROUTES_FOUND = 'No routes found for the requested swap',
  SWAP_INSUFFICIENT_LIQUIDITY = 'Solver has insufficient liquidity for this swap',
}

export type SupportedTokensReturnType = {
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  addresses: {
    chainId: number;
    address: Hex;
  }[];
}[];

export type TokenBalancesReturnType = {
  name: string;
  symbol: string;
  logoUrl: string;
  decimals: number;
  balance: Hex;
  usdValue: number;
  tokenPrice: number;
  breakdown: {
    chainId: number;
    balance: Hex;
    tokenAddress: Hex;
  }[];
}[];

export interface BuildSwapUserOpRequestBody {
  singerAddress: Hex;
  quote: RelayGetQuoteResponseBody;
}

export interface GetSwapQuoteRequestBody {
  senderAddress: Hex;
  inputs: {
    chainId: number;
    tokenAddress: Hex;
    amount: Hex;
  }[];
  output: {
    chainId: number;
    tokenAddress: Hex;
  };
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
}

export type GetSwapQuoteReturnType = RelayGetQuoteResponseBody;

export interface GetTokenPriceRequestBody {
  tokenAddress: Hex;
  chainId: number;
}

export type GetTokenPriceReturnType = AlchemyTokenPriceResponse;

export interface SubmitUserOpsRequestBody {
  userOps: UserOperation[];
  swapQuote: GetSwapQuoteReturnType;
}