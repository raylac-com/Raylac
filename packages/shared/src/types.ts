import { Hex } from 'viem';

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
