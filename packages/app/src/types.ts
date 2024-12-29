import { Hex } from 'viem';

export enum AddressType {
  Mnemonic = 'mnemonic',
  PrivateKey = 'private-key',
}

export interface UserAddress {
  address: Hex;
  type: AddressType;
  accountIndex?: number;
  // The address of the first account in the mnemonic group
  mnemonicGenesisAddress?: Hex;
}
