import { Hex } from "viem";

export interface Transfer {
  type: string;
  to?: string;
  from?: string;
  amount: number;
  timestamp: number;
}

export interface SplitTransfer {
  to: Hex;
  account: Hex;
  amount: bigint;
  tokenContract: Hex;
}
