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

export enum TransferStatus {
  Success,
  Pending,
}

export interface Transfer {
  type: string;
  status: TransferStatus;
  to?: Hex | User; // Address or User
  from?: Hex | User; // Address or User
  amount: number;
  timestamp: number;
}

export interface StealthInnerTransfer {
  from: StealthAddressWithEphemeral;
  to: StealthAddressWithEphemeral;
  amount: number;
}

export type StealthTransferData = StealthInnerTransfer[];

export interface User {
  id: number;
  name: string;
  username: string;
}

export interface RelayIntent {
  from: Hex;
  to: Hex;
  inputChainId: number;
  inputTokenId: string;
  outputChainId: number;
  outputTokenId: string;
  amount: bigint;
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
  }[];
}

export interface AcrossSuggestedFeesQueryParams {
  inputToken: Hex;
  outputToken: Hex;
  originChainId: number;
  destinationChainId: number;
  amount: string;
  recipient: Hex;
}

export interface AcrossFeeDetails {
  pct: string;
  total: string;
}

export interface AcrossSuggestedFeesResponse {
  totalRelayFee: AcrossFeeDetails;
  relayerCapitalFee: AcrossFeeDetails;
  relayerGasFee: AcrossFeeDetails;
  lpFee: AcrossFeeDetails;
  timestamp: string;
  isAmountTooLow: boolean;
  quoteBlock: string;
  spokePoolAddress: string;
  exclusiveRelayer: string;
  exclusivityDeadline: string;
  expectedFillTimeSec: string;
  limits: {
    minDeposit: number;
    maxDeposit: number;
    maxDepositInstant: number;
    maxDepositShortDelay: number;
    recommendedDepositInstant: number;
  };
}

export interface AcrossDepositV3Args {
  depositor: Hex;
  recipient: Hex;
  inputToken: Hex;
  outputToken: Hex;
  inputAmount: bigint;
  outputAmount: bigint;
  destinationChainId: number;
  exclusiveRelayer?: Hex;
  quoteTimestamp: number;
  fillDeadline: number;
  exclusivityDeadline?: number;
  message: Hex;
}

export interface MultiChainTransferRequestBody {
  bridgeUserOps: UserOperation[];
  userOpsAfterBridge: UserOperation[];
  finalTransferUserOp: UserOperation;
  consolidateToStealthAccount: StealthAddressWithEphemeral;
  relayQuotes: RelayGetQuoteResponseBody[];
}
