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
    gas?: number;
  };
  check: {
    endpoint: string;
    method: string;
  };
}

export interface BridgeStep {
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
  bridgeDetails: {
    to: Hex;
    amountIn: string;
    amountOut: string;
    amountInFormatted: string;
    amountOutFormatted: string;
    originChainGasCurrency: string;
    originChainGasFee: string;
    originChainGasFeeFormatted: string;
    originChainGasFeeUsd: string;
    destinationChainGasCurrency: string;
    destinationChainGasFee: string;
    destinationChainGasFeeFormatted: string;
    destinationChainGasFeeUsd: string;
    bridgeFee: string;
    bridgeFeeFormatted: string;
    bridgeFeeUsd: string;
    fromChainId: number;
    toChainId: number;
  };
  serializedTx: Hex;
}

export interface TransferStep {
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
  transferDetails: {
    to: Hex;
    amount: string;
    amountFormatted: string;
    amountUsd: string;
    chainId: number;
  };
  relayerFee?: RelayGasFee;
  serializedTx: Hex;
}

export interface CrossChainSwapStep {
  originChainId: number;
  destinationChainId: number;
  id: 'swap' | 'approve';
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
  /*
  swapDetails: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    amountOut: string;
    amountInUsd: string;
    amountOutUsd: string;
  };
  */
}

export interface SwapStep {
  originChainId: number;
  destinationChainId: number;
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
}

export interface ApproveStep {
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
}

export type SignedBridgeStep = BridgeStep & {
  signature: Hex;
};

export type SignedTransferStep = TransferStep & {
  signature: Hex;
};

export type SignedCrossChainSwapStep = CrossChainSwapStep & {
  signature: Hex;
};

export type SignedSingleInputSwapStep = SwapStep & {
  signature: Hex;
};

export type SignedApproveStep = ApproveStep & {
  signature: Hex;
};

export interface RelayExecutionStep {
  id: string;
  action: string;
  description: string;
  kind: string;
  requestId: string;
  items: RelayExecutionStepItem[];
}

export interface RelayGasFee {
  currency?: {
    chainId?: number;
    address?: Hex;
    symbol?: string;
    name?: string;
    decimals?: number;
  };
  amount?: string;
  amountFormatted?: string;
  amountUsd?: string;
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
  balances: {
    userBalance: string;
    requiredToSolve: string;
  };
  details: {
    operation: string;
    timeEstimate: number;
    userBalance: string;
    sender: string;
    recipient: string;
    currencyIn: {
      currency: {
        chainId: number;
        address: Hex;
        symbol: string;
        name: string;
        decimals: number;
        metadata: {
          logoURI: string;
          verified: boolean;
          isNative: boolean;
        };
      };
      amount: string;
      amountFormatted: string;
      amountUsd: string;
      minimumAmount: string;
    };
    currencyOut: {
      currency: {
        chainId: number;
        address: Hex;
        symbol: string;
        name: string;
        decimals: number;
        metadata: {
          logoURI: string;
          verified: boolean;
          isNative: boolean;
        };
      };
      amount: string;
      amountFormatted: string;
      amountUsd: string;
      minimumAmount: string;
    };
    totalImpact: {
      usd: string;
      percent: string;
    };
    swapImpact: {
      usd: string;
      percent: string;
    };
    rate: string;
    slippageTolerance: {
      origin: {
        usd: string;
        value: string;
        percent: string;
      };
      destination: {
        usd: string;
        value: string;
        percent: string;
      };
    };
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

export interface AlchemyTokenPriceResponse {
  network: string;
  address: Hex;
  prices: {
    currency: string;
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

export type RelaySupportedCurrenciesResponseBody = {
  groupID: string;
  chainId: number;
  address: Hex;
  symbol: string;
  name: string;
  decimals: number;
  vmType: string;
  metadata: {
    logoURI: string;
    verified: boolean;
    isNative: boolean;
  };
}[][];

export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  verified: boolean;
  color?: string;
  addresses: {
    chainId: number;
    address: Hex;
  }[];
}

export interface SwapInput {
  chainId: number;
  amount: bigint;
  token: Token;
}

export interface SwapOutput {
  chainId: number;
  token: Token;
}

export interface SendInput {
  chainId: number;
  token: Token;
  amount: bigint;
}

export interface LidoApyResponse {
  data: {
    timeUnix: number;
    apr: number;
  };
  meta: {
    symbol: string;
    address: string;
    chainId: number;
  };
}

export enum TokenSet {
  ETH = 'eth',
}

export interface Balance {
  balance: string;
  formatted: string;
  usdValue: string;
}
