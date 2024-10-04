import { $Enums } from '@prisma/client';
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

export interface StealthAddressWithEphemeral {
  address: Hex;
  viewTag: string;
  stealthPubKey: Hex;
  ephemeralPubKey: Hex;
}

export interface ERC5564AnnouncementData {
  schemeId: number;
  stealthAddress: string;
  caller: string;
  ephemeralPubKey: string;
  metadata: string;
  blockNumber: bigint;
  logIndex: number;
  txIndex: number;
  chainId: number;
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
 * Token balances of an address on a single chain
 */
export interface TokenBalance {
  tokenId: string;
  tokenAddress: Hex;
  stealthAddress: StealthAddressWithEphemeral;
  balance: string;
  chainId: number;
  nonce: number | null;
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

export interface MultiChainTransferRequestBody {
  aggregationUserOps: UserOperation[];
  finalTransferUserOp?: UserOperation;
  consolidateToStealthAccount?: StealthAddressWithEphemeral;
  relayQuotes: RelayGetQuoteResponseBody[];
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

/**
 * Decoded arguments for the `execute` function of RaylacAccount.sol
 */
export type RaylacAccountTransferData = {
  type: $Enums.ExecutionType;
  to: Hex;
  amount: bigint;
  tokenId: string;
  tag: string;
};

/**
 * Decoded arguments for the `execute` function of RaylacAccount.sol
 */
/*
export type RaylacAccountExecutionArgs =
  | RaylacAccountExecutionData<
      ExecutionType['Transfer'],
      {
        to: Hex;
        amount: bigint;
        tokenId: string;
        tag: string;
      }
    >
  | RaylacAccountExecutionData<
      ExecutionType['BridgeTransfer'],
      {
        to: Hex;
        amount: bigint;
        tokenId: string;
        tag: string;
      }
    >
  | RaylacAccountExecutionData<
      ExecutionType['AggregateTransfer'],
      {
        to: Hex;
        amount: bigint;
        tokenId: string;
      }
    >
  | RaylacAccountExecutionData<
      ExecutionType['AggregateBridgeTransfer'],
      {
        to: Hex;
        amount: bigint;
        tokenId: string;
        originChainId: number;
        destinationChainId: number;
      }
    >;
*/

export interface TransferHistoryQueryResult {
  amount: string;
  executionType: string;
  from: Hex;
  to: Hex;
  fromUserId: number;
  toUserId: number;
  tokenId: string;
  chainId: number;
  blockNumber: number;
  executionTag: Hex | null;
  txHash: Hex;
  traceAddress: string;
}

export interface TransferDetailsQueryResult {
  amount: string;
  executionType: string;
  from: Hex;
  to: Hex;
  fromUserId: number;
  toUserId: number;
  tokenId: string;
  chainId: number;
  blockNumber: number;
  executionTag: Hex | null;
  txHash: Hex;
  traceAddress: string;
}

export interface TransferWithExecutionTagQueryResult {
  amount: string;
  from: Hex;
  to: Hex;
  tokenId: string;
  fromUserId: number;
  toUserId: number;
  blockNumber: string;
  executionTag: Hex;
  txHash: Hex;
  traceAddress: string;
  success: boolean;
  chainId: number;
}

export interface TransferTraceQueryResult {
  amount: string;
  from: Hex;
  to: Hex;
  tokenId: string;
  chainId: number;
  blockNumber: string;
  txHash: Hex;
  traceAddress: string;
}

export interface RaylacTransferDetailsReturnType {
  fromUserId: number;
  toUserId: number;
  toAddress: Hex;
  tokenId: string;
  amount: string;
  traces: {
    chainId: number;
    txHash: Hex;
    from: Hex;
    to: Hex;
    amount: string;
    blockNumber: string;
  }[];
}

export interface NativeTransferDetailsReturnType {
  from: Hex;
  to: Hex;
  tokenId: string;
  amount: string;
  txHash: Hex;
  chainId: number;
  blockNumber: string;
}

export interface TokenBalanceQueryResult {
  tokenId: string;
  balance: string;
}

export interface AccountBalancePerChainQueryResult {
  chainId: number;
  balance: string;
  address: Hex;
  viewTag: string;
  stealthPubKey: Hex;
  ephemeralPubKey: Hex;
  tokenId: string;
  nonce: number | null;
}

export interface TokenBalancePerChainQueryResult {
  chainId: number;
  tokenId: string;
  balance: string;
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
