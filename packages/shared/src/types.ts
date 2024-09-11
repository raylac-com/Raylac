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
  balance: bigint;
  chain: Chain;
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
