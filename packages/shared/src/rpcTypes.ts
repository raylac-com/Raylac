import { Hex } from 'viem';
import { RelayGetQuoteResponseBody } from './types';

export enum TRPCErrorMessage {
  SWAP_AMOUNT_TOO_SMALL = 'Swap output amount is too small to cover fees required to execute swap',
}

export type SupportedTokensReturnType = {
  symbol: string;
  name: string;
  tokenAddress: Hex;
  decimals: number;
  logoURI: string;
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
  inputTokenAddress: Hex;
  outputTokenAddress: Hex;
  amount: Hex;
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
}

export type GetSwapQuoteResponseBody = RelayGetQuoteResponseBody;
