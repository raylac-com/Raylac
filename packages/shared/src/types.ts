import { Chain, Hex } from 'viem';

export interface UserOperation {
  sender: Hex;
  nonce: Hex;
  initCode: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  paymasterAndData: Hex;
  signature: Hex;
  chainId: number;
}

export interface DecodedUserOperationContext {
  /**
   * Tag to map transactions across multiple chains.
   * Transactions with the same multi chain tag are part of the same UserAction.
   */
  multiChainTag: Hex;
  /**
   * Number of chains that the UserAction that corresponds to this UserOperation spans.
   */
  numChains: number;
}

export interface StealthAddressWithEphemeral {
  address: Hex;
  viewTag: Hex;
  signerAddress: Hex;
  ephemeralPubKey: Hex;
}

export interface User {
  id: number;
  name: string;
  username: string;
}

export interface RelayGetQuoteRequestBody {
  user: Hex;
  recipient: Hex;
  originChainId: number;
  destinationChainId: number;
  amount: string;
  originCurrency: string;
  destinationCurrency: string;
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
}

export interface RelayExecutionStepItem {
  status: string;
  data: {
    to: Hex;
    data: Hex;
    value: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    chainId: number;
    gas: number;
  };
  check: {
    endpoint: string;
    method: string;
  };
}

export interface RelayExecutionStep {
  id: string;
  action: string;
  description: string;
  kind: string;
  requestId: string;
  items: RelayExecutionStepItem[];
}

export interface RelayGasFee {
  currency: object;
  amount: string;
  amountFormatted: string;
  amountUsd: string;
}

export interface RelayGetQuoteResponseBody {
  steps: RelayExecutionStep[];
  fees: {
    gas: RelayGasFee;
    relayer: RelayGasFee;
    relayerGas: RelayGasFee;
    relayerService: RelayGasFee;
    app: RelayGasFee;
  };
}

/**
 * Token balance of an address on a chain
 */
export interface AddressTokenBalance {
  tokenId: string;
  address: Hex;
  balance: string;
  chainId: number;
}

export interface SupportedToken {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  addresses: {
    address: Hex;
    chain: Chain;
    syncFrom?: bigint;
  }[];
}

export interface TraceInitAction {
  from: Hex;
  gas: Hex;
  init: Hex;
  value: Hex;
}

export interface TraceCallAction {
  from: Hex;
  callType: 'call' | 'delegatecall' | 'staticcall';
  gas: Hex;
  input: Hex;
  to: Hex;
  value: Hex;
}

type TraceResponse<T extends string, A> = {
  action: A;
  blockHash: Hex;
  blockNumber: number;
  result: { gasUsed: Hex; output: Hex };
  subtraces: number;
  traceAddress: number[];
  transactionHash: Hex;
  transactionPosition: number;
  type: T;
};

export type TraceResponseData =
  | TraceResponse<'call', TraceCallAction>
  | TraceResponse<'create', TraceInitAction>;

export type BlockTraceCallResponse = any;

export interface BlockTransactionResponse {
  from: Hex;
  gas: Hex;
  gasUsed: Hex;
  to: Hex;
  input: Hex;
  calls?: BlockTransactionResponse[];
  value: Hex;
  type: 'CALL' | 'CREATE';
}

export type BlockTraceResponse = {
  txHash: Hex;
  result: BlockTransactionResponse;
}[];

export type AnvilBlockTraceResponse = {
  action: {
    from: Hex;
    callType: 'call' | 'create';
    gas: Hex;
    input: Hex;
    to: Hex;
    value: Hex;
  };
  blockHash: Hex;
  blockNumber: number;
  result: { gasUsed: Hex; output: Hex };
  subtraces: number;
  traceAddress: number[];
  transactionHash: Hex;
  transactionPosition: number;
  type: 'call' | 'create';
}[];

export interface TraceWithTraceAddress extends BlockTransactionResponse {
  txHash: Hex;
  traceAddress: number[];
}

export interface TokenBalanceQueryResult {
  tokenId: string;
  balance: string;
}

export interface AccountBalancePerChainQueryResult {
  chainId: number;
  balance: string;
  address: Hex;
  tokenId: string;
}

export interface CoingeckoTokenPriceResponse {
  [key: string]: {
    usd: number;
  };
}

export type SyncJob = 'UserOps' | 'Traces';

export interface ChainGasInfo {
  baseFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  chainId: number;
}

export interface RaylacAccountExecuteArgs {
  to: Hex;
  value: bigint;
  data: Hex;
  tag: Hex;
}

export enum UserActionType {
  Transfer = '0x01',
  Swap = '0x02',
  Bridge = '0x03',
}

export enum Token {
  ETH = 'ETH',
  USDC = 'USDC',
}

export interface MultiChainTokenBalance {
  name: string;
  symbol: string;
  logoUrl: string;
  decimals: number;
  balance: string;
  usdValue?: number;
  tokenPrice?: number;
  breakdown: {
    chainId: number;
    balance: string;
    tokenAddress: Hex;
  }[];
}

export interface AlchemyTokenPriceResponse {
  network: 'string';
  address: Hex;
  prices: {
    currency: 'usd';
    lastUpdatedAt: string;
    value: string;
  }[];
}

export interface RelaySwapMultiInputRequestBody {
  user: Hex;
  recipient: Hex;
  origins: {
    chainId: number;
    currency: string;
    amount: string;
  }[];
  destinationCurrency: string;
  destinationChainId: number;
  partial: boolean;
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  useUserOperation: boolean;
}
