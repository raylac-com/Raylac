import { Hex } from 'viem';

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
  swapInput: {
    tokenAddress: Hex;
    amount: Hex;
    chainId: number;
  }[];
  swapOutput: {
    tokenAddress: Hex;
    chainId: number;
  };
}

export interface GetSwapQuoteRequestBody {
  senderAddress: Hex;
  inputTokenAddress: Hex;
  outputTokenAddress: Hex;
  amount: Hex;
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
}
