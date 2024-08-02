import { Hex } from 'viem';

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

export interface StealthAccount {
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
  to?: string;
  from?: string;
  amount: number;
  timestamp: number;
}
