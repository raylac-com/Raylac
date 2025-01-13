import { Hex } from 'viem';

export enum AddressType {
  Mnemonic = 'mnemonic',
  PrivateKey = 'private-key',
  Watch = 'watch',
}

export interface UserAddress {
  address: Hex;
  type: AddressType;
  accountIndex?: number;
  isBackupVerified: boolean;
  isDefault: boolean;
  isEmbedded?: boolean;
  embeddedType?: string; // Polymarket, Warpcast, etc

  // The address of the first account in the mnemonic group
  mnemonicGenesisAddress?: Hex;

  // Optional label for the address
  label?: string;
}
