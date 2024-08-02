import { Hex } from 'viem';

export interface SplitTransfer {
  to: Hex;
  account: Hex;
  amount: bigint;
  tokenContract: Hex;
}
